<?php

use Illuminate\Database\Eloquent\Model;

class Usuarioloja extends Model
{
    protected $connection = 'conc';
    protected $table = 'usuario_loja';

    protected $fillable = ['login', 'codigo_loja'];
}
