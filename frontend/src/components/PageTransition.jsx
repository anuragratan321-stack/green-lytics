import { motion as Motion } from 'framer-motion'

function PageTransition({ children }) {
  return (
    <Motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {children}
    </Motion.section>
  )
}

export default PageTransition
