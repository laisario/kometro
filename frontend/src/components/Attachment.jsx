import { Link } from '@mui/material'
import React from 'react'

const Attachment = ({ url, content }) => <Link underline='none' target="_blank" href={url}>{content}</Link>

export default Attachment