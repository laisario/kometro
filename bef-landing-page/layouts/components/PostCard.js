
import React from 'react'
import Image from "next/image";
import Link from "next/link";

function PostCard({post}) {
  return (
    <Link href={`/conhecimento/${post?.id}/`} className="group block">
      <article className="bg-card rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-300 group-hover:border-accent h-full">
        <div className="relative aspect-[4/3]">
          <Image
            src={post.imagem_destaque || post.imagem_destaque_url || "/placeholder.svg"}
            alt={post.titulo}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="p-6">
          <span
            className="inline-block mb-3 px-2 py-1 text-sm font-medium rounded-full bg-[#DDDDDD] text-[#424242] capitalize"
          >
            {post?.categoria?.nome}
          </span>
          <h3 className="text-xl font-bold text-foreground mb-3 text-balance group-hover:text-primary transition-colors">
            {post?.titulo}
          </h3>
          <p className="text-muted-foreground leading-relaxed text-pretty">{post?.resumo}</p>
          <div className="mt-4">
            <span className="text-primary font-medium group-hover:underline">Ler mais →</span>
          </div>
        </div>
      </article>
    </Link>
  )
}

export default PostCard