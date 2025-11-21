<?php

namespace App\Http\Controllers;

use App\Models\Pcempr;
use App\Models\Pcfilial;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class CadastroController extends Controller
{
    private const PERFIL_FISCAL = 9845;
    private const PERFIL_OPERADOR = 9846;
    private const PERFIS_FISCAL = [1, 2, 5];
    private const PERFIS_OPERADOR = [1];

    public function buscarFuncionarios(Request $request)
    {
        $termo = strtoupper($request->input('nome'));

        $funcionarios = Pcempr::selectRaw("
                MATRICULA,
                NOME,
                usuariobd,
                CODFILIAL,
                CASE CODSETOR
                    WHEN 21 THEN 'OPERADOR(A) / RECEPCAO'
                    WHEN 26 THEN 'FISCAL'
                    ELSE ''
                END AS PERFIL,
                CODUSUR
            ")
            ->whereNotIn('CODFILIAL', [1])
            ->where('SITUACAO', 'A')
            ->whereIn('CODSETOR', [21, 26])
            ->where(function ($query) use ($termo) {
                $query->whereRaw("UPPER(NOME) LIKE ?", ["%$termo%"])
                    ->orWhereRaw("CAST(MATRICULA AS VARCHAR2(10)) LIKE ?", ["%$termo%"]);
            })
            ->get();

        return response()->json($funcionarios);
    }

    public function perfis()
    {
        $perfis = Pcempr::select('MATRICULA as codigo', 'NOME as nome')
            ->where('USUARIOBD', 'LIKE', 'PERFIL%')
            ->where('SITUACAO', 'A')
            ->get();

        return response()->json($perfis);
    }

    public function filiais()
    {
        $filiais = Pcfilial::selectRaw('CODIGO as codfilial, CONTATO as local')
            ->whereNotIn('CODIGO', [99, 50, 51, 52, 53, 1, 2, 11])
            ->whereNotNull('CODDOCNF')
            ->whereNull('DTEXCLUSAO')
            ->orderByRaw('TO_NUMBER(CODIGO)')
            ->get();

        return response()->json($filiais);
    }

    public function transfunc(Request $request)
    {
        $perfil = $request->input('perfil_codigo');
        $funcionario = $request->input('matricula_destino');
        $filial = $request->input('filial_destino');

        $usuarioLogado = Auth::guard('oracle')->user();
        $matriculaLogado = $usuarioLogado->matricula ?? 'desconhecido';

        try {
            $mensagem = $this->executarTransferencia($perfil, $funcionario, $filial);

            $this->registrarLog($request, $matriculaLogado, $mensagem);

            $mensagem = $this->processarLojaConc($funcionario, $filial, $mensagem);

            $mensagem = $this->configurarPerfisUsuario($perfil, $funcionario, $mensagem);

            return response()->json(['mensagem' => $mensagem]);

        } catch (\Exception $e) {
            $this->registrarErro($matriculaLogado, $e->getMessage());
            return response()->json(['mensagem' => $e->getMessage()], 500);
        }
    }

    private function executarTransferencia(int $perfil, int $funcionario, int $filial): string
    {
        $pdo = DB::connection('oracle')->getPdo();

        $stmt = $pdo->prepare("
            DECLARE
                V_MSG VARCHAR2(4000);
            BEGIN
                BDC_PRC_TRANSFUNC(:perfil, :funcionario, :filial, V_MSG);
                :mensagem := V_MSG;
            END;
        ");

        $stmt->bindParam(':perfil', $perfil);
        $stmt->bindParam(':funcionario', $funcionario);
        $stmt->bindParam(':filial', $filial);
        $stmt->bindParam(':mensagem', $mensagem, \PDO::PARAM_INPUT_OUTPUT, 4000);

        $stmt->execute();

        return $mensagem;
    }

    private function registrarLog(Request $request, string $matriculaLogado, string $mensagem): void
    {
        $logPath = public_path('logs');

        if (!File::exists($logPath)) {
            File::makeDirectory($logPath, 0755, true);
        }

        $now = now()->format('d-m-Y H:i:s');
        $ip = $request->ip();
        $logFile = $logPath . '/transfunc-log.txt';

        $logMessage = <<<LOG
        ================================================================================
        [{$now}] - Usuário: {$matriculaLogado} | IP: {$ip}
        Retorno : {$mensagem}
        ================================================================================

        LOG;

        File::append($logFile, $logMessage);
    }

    private function processarLojaConc(int $funcionario, int $filial, string $mensagem): string
    {
        $loja_conc = DB::connection('conc')
            ->table('loja')
            ->where('codigo_loja', $filial)
            ->first();

        if (empty($loja_conc)) {
            return $mensagem;
        }

        $usuario_loja = DB::connection('conc')
            ->table('usuario_loja')
            ->where('login', $funcionario)
            ->where('codigo_loja', $filial)
            ->first();

        if (empty($usuario_loja)) {
            DB::connection('conc')
                ->table('usuario_loja')
                ->insert([
                    'login' => $funcionario,
                    'codigo_loja' => $filial
                ]);

            $mensagem .= " | Usuário adicionado na loja {$filial}.";
        }

        return $mensagem;
    }

    private function configurarPerfisUsuario(int $perfil, int $funcionario, string $mensagem): string
    {
        if ($perfil === self::PERFIL_FISCAL) {
            return $this->configurarPerfisFiscal($funcionario, $mensagem);
        }

        if ($perfil === self::PERFIL_OPERADOR) {
            return $this->configurarPerfisOperador($funcionario, $mensagem);
        }

        return $mensagem;
    }

    private function configurarPerfisFiscal(int $funcionario, string $mensagem): string
    {
        $usuario = $this->buscarUsuarioConc($funcionario);

        if (!$usuario) {
            return $mensagem;
        }

        $this->sobrescreverPerfis($usuario->id, self::PERFIS_FISCAL);

        return $mensagem . " | Perfis Fiscal (1, 2, 5) configurados.";
    }

    private function configurarPerfisOperador(int $funcionario, string $mensagem): string
    {
        $usuario = $this->buscarUsuarioConc($funcionario);

        if (!$usuario) {
            return $mensagem;
        }

        $this->sobrescreverPerfis($usuario->id, self::PERFIS_OPERADOR);

        return $mensagem . " | Perfil Operador (1) configurado.";
    }

    private function buscarUsuarioConc(int $funcionario)
    {
        return DB::connection('conc')
            ->table('usuario_security')
            ->select('id', 'login')
            ->where('login', $funcionario)
            ->first();
    }

    private function sobrescreverPerfis(int $idUsuario, array $perfis): void
    {
        // Remove todos os perfis existentes
        DB::connection('conc')
            ->table('usuario_perfil')
            ->where('id_usuario', $idUsuario)
            ->delete();

        // Insere os novos perfis
        foreach ($perfis as $idPerfil) {
            DB::connection('conc')
                ->table('usuario_perfil')
                ->insert([
                    'id_usuario' => $idUsuario,
                    'id_perfil' => $idPerfil
                ]);
        }
    }

    private function registrarErro(string $matriculaLogado, string $erro): void
    {
        $logFile = public_path('logs/transfunc-log.txt');
        $logMessage = now() . " - ERRO - Usuário: {$matriculaLogado} - {$erro}" . PHP_EOL;
        File::append($logFile, $logMessage);
    }
}
