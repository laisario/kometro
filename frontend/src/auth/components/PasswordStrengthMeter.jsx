import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Box, LinearProgress, Typography } from '@mui/material';

function LinearProgressWithLabel(props) {
  const getLevel = (value) => {
    if (value <= 25) return 'Fraca'
    if (value > 25 && value <= 50) return "Média"
    if (value > 50 && value <= 75) return "Forte"
    return "Muito forte"
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Box sx={{ flex:1, mr: 2 }}>
        <LinearProgress color="secondary" variant="determinate" {...props} />
      </Box>
      <Box sx={{ minWidth: 50 }}>
        <Typography variant="body2" fontWeight="700" color="secondary">Senha {getLevel(props?.value)}</Typography>
      </Box>
    </Box>
  );
}

LinearProgressWithLabel.propTypes = {
  value: PropTypes.number.isRequired,
};

export default function PasswordStrengthMeter({ password }) {
  const [progress, setProgress] = useState(10);
  const [warning, setWarning] = useState('');

  useEffect(() => {
    import('@contentpass/zxcvbn').then(({ default: zxcvbn }) => {
      const result = zxcvbn(password, {
        feedback_messages: {
          use_a_few_words: 'Use mais algumas palavras, evite frases comuns',
          no_need_for_mixed_chars: 'Não há necessidade de símbolos, dígitos ou letras maiúsculas',
          uncommon_words_are_better: 'Adicione outra palavra. Palavras incomuns são melhores.',
          straight_rows_of_keys_are_easy: 'Teclas em linha reta são fáceis de adivinhar',
          short_keyboard_patterns_are_easy: 'Padrões curtos de teclado são fáceis de adivinhar',
          use_longer_keyboard_patterns: 'Use um padrão de teclado mais longo com mais voltas',
          repeated_chars_are_easy: 'Repetições como aaa são fáceis de adivinhar',
          repeated_patterns_are_easy: 'Repetições como "abcabcabc" são apenas um pouco mais difíceis de adivinhar do que "abc"',
          avoid_repeated_chars: 'Evite palavras e caracteres repetidos',
          sequences_are_easy: 'Sequências como abc ou 6543 são fáceis de adivinhar',
          avoid_sequences: 'Evite sequências',
          recent_years_are_easy: 'Os últimos anos são fáceis de adivinhar',
          avoid_recent_years: 'Evite os últimos anos',
          avoid_associated_years: 'Evite anos associados a você',
          dates_are_easy: 'As datas costumam ser fáceis de adivinhars',
          avoid_associated_dates_and_years: 'Evite datas e anos associados a você',
          top10_common_password: 'Esta é uma das 10 senhas mais comuns do mundo',
          top100_common_password: 'Esta é uma das 100 senhas mais comuns',
          very_common_password: 'Esta é uma senha muito comum',
          similar_to_common_password: 'Isso é semelhante a uma senha comumente usada',
          a_word_is_easy: 'Uma unica palavra é fácil de adivinhar',
          names_are_easy: 'Nomes e sobrenomes por si só são fáceis de adivinhar',
          common_names_are_easy: 'Nomes e sobrenomes comuns são fáceis de adivinhar',
          capitalization_doesnt_help: 'Letras maiusculas e minusculas não ajudam muito nesse caso',
          all_uppercase_doesnt_help: 'Todas as letras maiúsculas são quase tão fáceis de adivinhar quanto todas as letras minúsculas',
          reverse_doesnt_help: 'Palavras invertidas não são muito mais difíceis de adivinhar',
          substitution_doesnt_help: 'Substituições previsíveis como \'@\' em vez de \'a\' não ajudam muito',
          user_dictionary: 'Esta senha está na lista negra',
        }
      })
      setProgress((result?.score / 4) * 100)
      setWarning(result?.feedback?.warning)
    }).catch(error => console.log(error))
  }, [password])

  return (
    <Box sx={{ width: '100%' }}>
      <LinearProgressWithLabel value={progress} />
      {!!password?.length && !!warning && <>
        <Typography variant="body2" color="secondary">{warning}</Typography>
      </>}
    </Box>
  );
}

PasswordStrengthMeter.propTypes = {
    password: PropTypes.string.isRequired,
}