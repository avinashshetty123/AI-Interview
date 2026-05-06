import logo from '../assets/Logo.png'

const Footer = () => {
  return (
    <footer className="border-t border-gray-200 py-8 px-4 bg-[#182131]">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <img src={logo} alt="Jankoti" className="h-7 w-auto" />
        <span className="text-sm text-gray-400">
          © {new Date().getFullYear()} Jankoti. All rights reserved.
        </span>
        <div className="flex items-center gap-5 text-sm text-gray-400">
          <a href="#" className="hover:text-white transition-colors">Privacy</a>
          <a href="#" className="hover:text-white transition-colors">Terms</a>
          <a href="#" className="hover:text-white transition-colors">Contact</a>
        </div>
      </div>
    </footer>
  )
}

export default Footer