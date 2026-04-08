import { motion as Motion } from 'framer-motion'

function Button({ children, className = '', ...props }) {
  return (
    <Motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.18 }}
      className={
        'rounded-2xl bg-black px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors dark:bg-white dark:text-black ' +
        className
      }
      {...props}
    >
      {children}
    </Motion.button>
  )
}

export default Button
