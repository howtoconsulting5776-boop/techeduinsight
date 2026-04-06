export default function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-brand-navy py-10 text-center text-sm text-white/90">
      <p className="font-medium tracking-tight text-white">TechEdu Insight</p>
      <p className="mt-1 text-xs text-white/65">© {new Date().getFullYear()}</p>
    </footer>
  )
}
