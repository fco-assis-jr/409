<?php

use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\CadastroController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Rotas Públicas (sem autenticação)
|--------------------------------------------------------------------------
*/

// Rota principal (redireciona para login)
Route::get('/', fn () => Inertia::render('login'));

// Página de login
Route::get('/login', fn () => Inertia::render('login'))->name('login');

// Envio do formulário de login
Route::post('/login', [LoginController::class, 'login'])->name('login.post');

//Login Winthor
Route::get('/winthor', [LoginController::class, 'winthor'])->name('winthor');


/*
|--------------------------------------------------------------------------
| Rotas Protegidas (autenticadas com 'auth:oracle')
|--------------------------------------------------------------------------
*/

Route::middleware('auth:oracle')->group(function () {

    // Home
    Route::get('/home', function () {
        return Inertia::render('dashboard', [
            'usuario' => Auth::guard('oracle')->user(),
        ]);
    })->name('home');

    // API interna (prefixada com /api)
    Route::prefix('api')->group(function () {
        Route::get('/perfis', [CadastroController::class, 'perfis']);
        Route::get('/filiais', [CadastroController::class, 'filiais']);
        Route::get('/funcionarios', [CadastroController::class, 'buscarFuncionarios']);
        Route::post('/transfunc', [CadastroController::class, 'transfunc']);
    });

    // Logout
    Route::get('/logout', [LoginController::class, 'logout'])->name('logout');
});
