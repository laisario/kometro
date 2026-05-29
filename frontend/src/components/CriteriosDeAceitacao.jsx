import { useState } from "react";
import { Grid, TextField, Button, IconButton, Table, TableHead, TableRow, TableCell, TableBody, CircularProgress } from "@mui/material";
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";


const CriteriosDeAceitacao = ({
  form,
  fieldName = "criteriosAceitacao",
  onRemoveItem,
  deletingItems = {},
}) => {
  const [novoCriterio, setNovoCriterio] = useState({
    tipo: "",
    criterioDeAceitacao: "",
    referenciaDoCriterio: "",
    observacaoCriterioAceitacao: "",
    unidade: "",
  });

  const handleChange = (e) => {
    setNovoCriterio((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };
  const handleAdd = () => {
    const currentValues = form.getValues(fieldName) || [];
    if (editIndex !== null) {
      const updated = [...currentValues];
      updated[editIndex] = novoCriterio;
      form.setValue(fieldName, updated);
      setEditIndex(null);
    } else {
      form.setValue(fieldName, [...currentValues, novoCriterio]);
    }
    setNovoCriterio({
      tipo: "",
      criterioDeAceitacao: "",
      unidade: "",
      referenciaDoCriterio: "",
      observacaoCriterioAceitacao: "",
    });
  };

  const removeFromState = (index) => {
    const currentValues = form.getValues(fieldName) || [];
    const newValues = currentValues.filter((_, i) => i !== index);
    form.setValue(fieldName, newValues);
    if (editIndex === index) {
      setEditIndex(null);
      setNovoCriterio({
        tipo: "",
        criterioDeAceitacao: "",
        unidade: "",
        referenciaDoCriterio: "",
        observacaoCriterioAceitacao: "",
      });
    }
  };

  const handleRemove = async (item, index) => {
    if (onRemoveItem) {
      await onRemoveItem(item, () => removeFromState(index));
      return;
    }
    removeFromState(index);
  };

  const handleEdit = (index) => {
    const currentValues = form.getValues(fieldName) || [];
    setNovoCriterio(currentValues[index]);
    setEditIndex(index);
  };

  const values = form.watch(fieldName) || [];
  const [editIndex, setEditIndex] = useState(null);


  return (
    <>
      <Grid container spacing={2}>
        <Grid item xs={6} sm={4}>
          <TextField
            label="Tipo"
            name="tipo"
            size="small"
            fullWidth
            value={novoCriterio.tipo}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={6} sm={4}>
          <TextField
            label="Critério de Aceitação"
            name="criterioDeAceitacao"
            type="number"
            size="small"
            inputProps={{ step: "any", inputMode: "decimal" }}
            fullWidth
            value={novoCriterio?.criterioDeAceitacao}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={4} sm={4}>
          <TextField
            label="Unidade"
            name="unidade"
            size="small"
            fullWidth
            value={novoCriterio?.unidade}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={8} sm={4}>
          <TextField
            label="Referência do Critério"
            name="referenciaDoCriterio"
            size="small"
            fullWidth
            value={novoCriterio?.referenciaDoCriterio}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={9} sm={5}>
          <TextField
            label="Observações"
            name="observacaoCriterioAceitacao"
            size="small"
            multiline
            fullWidth
            value={novoCriterio?.observacaoCriterioAceitacao}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={2}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAdd}
          >
            {editIndex !== null ? "Salvar" : "Adicionar"}
          </Button>
        </Grid>
      </Grid>
      <Table padding='none' size='small' sx={{ mt: 1, width: '100%' }}>
        <TableHead>
          <TableRow>
            <TableCell>Tipo</TableCell>
            <TableCell>Critério de Aceitação</TableCell>
            <TableCell>Unidade</TableCell>
            <TableCell>Referência</TableCell>
            <TableCell>Observação</TableCell>
            <TableCell align="right">Ações</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {values?.map((criterio, index) => {
            const isDeleting = !!(criterio?.id && deletingItems[criterio.id]);

            return (
            <TableRow key={criterio?.id ?? index}>
              <TableCell>{criterio.tipo || "-"}</TableCell>
              <TableCell>{criterio.criterioDeAceitacao || "-"}</TableCell>
              <TableCell>{criterio.unidade || "-"}</TableCell>
              <TableCell>{criterio.referenciaDoCriterio || "-"}</TableCell>
              <TableCell>{criterio.observacaoCriterioAceitacao || "-"}</TableCell>
              <TableCell sx={{display: 'flex'}} align="right">
                <IconButton color="primary" disabled={isDeleting} onClick={() => handleEdit(index)}>
                  <EditIcon />
                </IconButton>
                <IconButton color="error" disabled={isDeleting} onClick={() => handleRemove(criterio, index)}>
                  {isDeleting ? <CircularProgress size={20} /> : <DeleteIcon />}
                </IconButton>
              </TableCell>
            </TableRow>
          )})}
          {!values?.length && (
            <TableRow>
              <TableCell colSpan={6} align="center">
                Nenhum critério adicionado
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </>
  )
}

export default CriteriosDeAceitacao;
