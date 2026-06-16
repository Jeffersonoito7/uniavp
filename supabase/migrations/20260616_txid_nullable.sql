-- txid é campo PIX; pagamentos via cartão não têm txid
ALTER TABLE gestor_pagamentos ALTER COLUMN txid DROP NOT NULL;
