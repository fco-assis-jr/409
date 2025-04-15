<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Pcempr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class LoginController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'usuario' => 'required',
            'senha' => 'required',
        ]);

        $usuario = strtoupper($request->input('usuario'));
        $senha = strtoupper($request->input('senha'));

        $user = Pcempr::whereRaw("
            usuariobd = ?
            AND CRYPT(?, usuariobd) = senhabd
            AND situacao = 'A'
        ", [$usuario, $senha])->first();

        if (!$user) {
            return back()->withErrors([
                'usuario' => 'Usuário ou senha inválidos.',
            ])->onlyInput('usuario');
        }

        $temAcesso = DB::connection('oracle')->table('PCCONTRO')
            ->where('codrotina', 409)
            ->where('acesso', 'S')
            ->where('codusuario', $user->matricula)
            ->exists();

        if (!$temAcesso) {
            return back()->withErrors([
                'usuario' => 'Usuário sem permissão de acesso.',
            ])->onlyInput('usuario');
        }

        Auth::guard('oracle')->login($user);

        return redirect()->route('dashboard');
    }

    public function winthor(Request $request)
    {
        $terminal = strtoupper($request->query('terminal'));

        $sql = /** @lang text */
            "
        SELECT *
        FROM PCEMPR e
        WHERE e.MATRICULA IN (
            SELECT codusuario
            FROM PCCONTRO
            WHERE codrotina = 409
              AND acesso = 'S'
              AND TO_CHAR(codusuario) IN (
                SELECT TO_CHAR(p.action)
                FROM V\$SESSION p
                WHERE p.terminal = ?
                  AND p.action IS NOT NULL
                  AND EXISTS (
                      SELECT 1
                      FROM PCEMPR
                      WHERE TO_CHAR(matricula) = TO_CHAR(p.action)
                      AND ROWNUM = 1
                  )
              )
        )
        AND e.SITUACAO = 'A'
        AND ROWNUM = 1
    ";

        try {
            $usuarios = Pcempr::fromQuery($sql, [$terminal]);
            $usuario = $usuarios[0] ?? null;

            if (!$usuario) {

                return back()->withErrors([
                    'terminal' => 'Sessão não encontrada para este terminal ou acesso negado.',
                ]);
            }

            Auth::guard('oracle')->login($usuario);

            return redirect()->route('dashboard');

        } catch (\Throwable $e) {
            Log::error('Erro ao executar login do terminal', [
                'terminal' => $terminal,
                'exception' => $e->getMessage(),
            ]);

            return back()->withErrors([
                'terminal' => 'Erro interno ao autenticar. Contate o suporte.',
            ]);
        }
    }

    public function logout(Request $request)
    {
        $sessionId = $request->session()->getId();

        Auth::guard('oracle')->logout();

        DB::table('sessions')->where('id', $sessionId)->delete();

        return redirect('/login');
    }
}
