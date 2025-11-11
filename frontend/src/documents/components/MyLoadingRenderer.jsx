import React from 'react'
import { CircularProgress } from '@mui/material';

const MyLoadingRenderer = ({ document }) => {
  const fileText = document?.titulo || "";

  if (fileText) {
    return <div>Carregando renderização ({fileText})...</div>;
  }

  return <div style={{position: 'absolute', top: '47%', left: '47%'}}><CircularProgress /></div>;
};

export default MyLoadingRenderer