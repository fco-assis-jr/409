<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pcfilial extends Model
{
    protected $connection = 'oracle';
    protected $table = 'PCFILIAL';
    public $timestamps = false;

    protected $primaryKey = 'CODIGO';
    public $incrementing = false;

    protected $fillable = ['CODIGO', 'CONTATO'];
}
