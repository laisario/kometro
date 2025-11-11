import React from 'react'

function Lgpd({ data }) {
  const { frontmatter } = data;
  const { subtitle, name, email, address, description } = frontmatter;
  return (
    <div className='section container'>

      <h4 className='mb-8'>{subtitle}</h4>
      <div className='flex flex-col justify-center items-left list-disc list-inside'>
        <p className="border-t border-border pt-6">{name}</p>
        <p>Email: {email}</p>
        <p>{address}</p>
        <p className="border-b border-border pb-6">{description}</p>
      </div>

    </div>
  )
}

export default Lgpd