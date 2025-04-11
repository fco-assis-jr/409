<?php

namespace App\Models;

use Illuminate\Contracts\Auth\Authenticatable as AuthenticatableContract;
use Illuminate\Auth\Authenticatable;
use Illuminate\Database\Eloquent\Model;

class Pcempr extends Model implements AuthenticatableContract
{
    use Authenticatable;

    protected $table = 'pcempr';

    protected $primaryKey = 'matricula';

    public $timestamps = false;

    protected $connection = 'oracle';

    protected $fillable = [
        'matricula', 'codfilial', 'nome', 'usuariobd', 'codsetor', 'situacao' , 'codusur'
    ];

    public function getAuthIdentifierName()
    {
        return 'matricula';
    }

    public function save(array $options = [])
    {
        return false;
    }

    public function delete()
    {
        return false;
    }

    public function update(array $attributes = [], array $options = [])
    {
        return false;
    }

    /**
     * Converte os campos para UTF-8, vindo do Oracle com charset WE8MSWIN1252
     */
    public function toArray()
    {
        return array_map(function ($value) {
            return is_string($value)
                ? iconv('Windows-1252', 'UTF-8//IGNORE', $value)
                : $value;
        }, parent::toArray());
    }
}
