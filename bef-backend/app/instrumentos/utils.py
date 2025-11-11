from dateutil.relativedelta import relativedelta


PERIODOS_RELATIVEDELTA = {
    "dia": "days",
    "mes": "months",
    "ano": "years",
    "dias": "days",
    "meses": "months",
    "anos": "years",
}


def calcular_data_proxima_calibracao_servico(instrumento, criado=False):
    if not instrumento.frequencia_calibracao:
        return None

    quantidade = instrumento.frequencia_calibracao.quantidade
    periodo = instrumento.frequencia_calibracao.periodo
    arg = PERIODOS_RELATIVEDELTA.get(periodo.lower())
    posicao_uso = instrumento.Posicao.EM_USO
    if not arg:
        return None

    if criado and instrumento.posicao == posicao_uso and instrumento.data_ultima_calibracao:
        return instrumento.data_ultima_calibracao + relativedelta(**{arg: quantidade})

    if instrumento.posicao == posicao_uso and instrumento.data_utilizacao:
        return instrumento.data_utilizacao + relativedelta(**{arg: quantidade})

    return None


def calcular_data_proxima_calibracao_calendario(instrumento):
    if not (instrumento.frequencia_calibracao and instrumento.data_ultima_calibracao):
        return None

    quantidade = instrumento.frequencia_calibracao.quantidade
    periodo = instrumento.frequencia_calibracao.periodo

    arg = PERIODOS_RELATIVEDELTA.get(periodo.lower())

    if not arg:
        return None
    
    
    return instrumento.data_ultima_calibracao + relativedelta(**{arg: quantidade})
            


def calcular_data_proxima_checagem_servico(instrumento, criado=False):
    if not instrumento.frequencia_checagem:
        return None

    quantidade = instrumento.frequencia_checagem.quantidade
    periodo = instrumento.frequencia_checagem.periodo
    arg = PERIODOS_RELATIVEDELTA.get(periodo.lower())
    posicao_uso = instrumento.Posicao.EM_USO

    if not arg:
        return None

    if criado and instrumento.posicao == posicao_uso and instrumento.data_ultima_checagem:
        return instrumento.data_ultima_checagem + relativedelta(**{arg: quantidade})

    if instrumento.posicao == posicao_uso and instrumento.data_utilizacao:
        return instrumento.data_utilizacao + relativedelta(**{arg: quantidade})

    return None


def calcular_data_proxima_checagem_calendario(instrumento):
    if not (instrumento.frequencia_checagem and instrumento.data_ultima_checagem):
        return None

    quantidade = instrumento.frequencia_checagem.quantidade
    periodo = instrumento.frequencia_checagem.periodo

    arg = PERIODOS_RELATIVEDELTA.get(periodo.lower())

    if not arg:
        return None
    
    return instrumento.data_ultima_checagem + relativedelta(**{arg: quantidade})
            