function Card({ title, description, icon: Icon, children, className = '' }) {
  return (
    <article className={'rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-colors dark:border-zinc-800 dark:bg-zinc-900 ' + className}>
      {Icon ? (
        <span className='mb-4 inline-flex rounded-xl bg-zinc-100 p-2 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200'>
          <Icon size={18} />
        </span>
      ) : null}
      {title ? <h3 className='text-xl font-semibold text-zinc-900 dark:text-white'>{title}</h3> : null}
      {description ? <p className='mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300'>{description}</p> : null}
      {children}
    </article>
  )
}

export default Card
