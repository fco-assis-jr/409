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
    public function buscarFuncionarios(Request $request)
    {
        $termo = strtoupper($request->input('nome'));

        $funcionarios = Pcempr::selectRaw("
                MATRICULA,
                NOME,
                usuariobd,
                CODFILIAL,
                CASE CODSETOR
                    WHEN 21 THEN 'OPERADOR(A)'
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

            $logPath = public_path('logs');
            if (!File::exists($logPath)) {
                File::makeDirectory($logPath, 0755, true);
            }

            $logFile = $logPath . '/transfunc-log.txt';
            $logMessage = now() . " - Usuário: {$matriculaLogado} - Perfil: {$perfil}, Funcionário: {$funcionario}, Filial: {$filial}, Mensagem: {$mensagem}" . PHP_EOL;
            File::append($logFile, $logMessage);

            return response()->json(['mensagem' => $mensagem]);
        } catch (\Exception $e) {
            $logFile = public_path('logs/transfunc-log.txt');
            $logMessage = now() . " - ERRO - Usuário: {$matriculaLogado} - {$e->getMessage()}" . PHP_EOL;
            File::append($logFile, $logMessage);

            return response()->json(['mensagem' => $e->getMessage()], 500);
        }
    }
}
