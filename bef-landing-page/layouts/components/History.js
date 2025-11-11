import React from 'react'
import { markdownify } from "@lib/utils/textConverter";
import Timeline from './Timeline';

function History({timeline}) {
  return (
    <div className='container'>
      <div className="mb-16">
        <h2>{markdownify(timeline?.title)}</h2>
      </div>
      <div className="hidden md:block">
        <img src={timeline?.image} alt="Timeline história Kometro" />
      </div>
      <div className="block md:hidden flex w-full" >
        <Timeline periods={timeline?.periods} />
      </div>
    </div>
  )
}

export default History