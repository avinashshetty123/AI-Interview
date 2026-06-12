import { Link } from 'react-router-dom'
import { FiUpload, FiCpu, FiMessageSquare, FiBarChart2, FiShield, FiZap, FiAward, FiArrowRight, FiFileText } from 'react-icons/fi'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'


const STEPS = [
  { icon: <FiUpload size={22} />,       num: '01', title: 'Upload Resume',      desc: 'Drop your PDF, DOCX, or TXT resume and let us parse it instantly.' },
  { icon: <FiCpu size={22} />,          num: '02', title: 'AI Generates Questions', desc: 'Our AI crafts personalized questions based on your skills and experience.' },
  { icon: <FiMessageSquare size={22} />, num: '03', title: 'Answer & Practice',  desc: 'Go through the interview at your own pace and submit your answers.' },
  { icon: <FiBarChart2 size={22} />,    num: '04', title: 'Get Analysis',        desc: 'Receive detailed feedback and a score to track your improvement.' },
]

const FEATURES = [
  { icon: <FiZap size={20} />,      title: 'AI-Powered Questions',  desc: 'Groq-powered engine generates role-specific questions tailored to your resume.' },
  { icon: <FiShield size={20} />,   title: 'ATS Quality Check',     desc: 'Instantly assess how well your resume passes Applicant Tracking Systems.' },
  { icon: <FiFileText size={20} />, title: 'Resume Builder',        desc: 'Create ATS-optimized resumes with 100% compatibility score using AI.' },
  { icon: <FiAward size={20} />,    title: 'Leaderboard',           desc: 'Compare your scores with other candidates and climb the ranks.' },
  { icon: <FiBarChart2 size={20} />, title: 'Deep Analysis',        desc: 'Get per-question feedback, strengths, and areas to improve after each session.' },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      <Navbar />

      {/* ── Hero ── */}
      <section className="pt-36 pb-20 px-4">
        <div className="max-w-5xl mx-auto flex flex-col items-center text-center gap-6">

          {/* Badge */}
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold
                           tracking-widest uppercase bg-violet-100 text-violet-700 border border-violet-200">
            <FiZap size={11} /> AI Interview Platform
          </span>

          {/* Headline */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-gray-900 leading-[1.1]">
            Ace Your Next{' '}
            <span className="bg-gradient-to-r from-violet-600 to-fuchsia-500
                             bg-clip-text text-transparent">
              Interview
            </span>
            <br />with AI
          </h1>

          <p className="text-lg text-gray-500 max-w-xl leading-relaxed">
            Upload your resume, get personalized interview questions powered by AI,
            practice your answers, and receive instant feedback — all in one place.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
            <Link to="/interview"
                  className="flex items-center gap-2 px-7 py-3.5 rounded-2xl text-sm font-bold text-white
                             bg-gradient-to-r from-violet-600 to-fuchsia-500
                             shadow-[0_8px_28px_rgba(109,40,217,0.45)]
                             hover:shadow-[0_12px_36px_rgba(109,40,217,0.55)]
                             hover:scale-[1.03] active:scale-95 transition-all duration-200">
              <FiZap size={15} /> Start Free Interview
            </Link>
            <Link to="/ats-checker"
                  className="flex items-center gap-2 px-7 py-3.5 rounded-2xl text-sm font-bold text-white
                             bg-gradient-to-r from-blue-600 to-cyan-500
                             shadow-[0_8px_28px_rgba(59,130,246,0.45)]
                             hover:shadow-[0_12px_36px_rgba(59,130,246,0.55)]
                             hover:scale-[1.03] active:scale-95 transition-all duration-200">
              <FiShield size={15} /> Check Resume
            </Link>
            <Link to="/resume-builder"
                  className="flex items-center gap-2 px-7 py-3.5 rounded-2xl text-sm font-bold text-white
                             bg-gradient-to-r from-green-600 to-emerald-500
                             shadow-[0_8px_28px_rgba(34,197,94,0.45)]
                             hover:shadow-[0_12px_36px_rgba(34,197,94,0.55)]
                             hover:scale-[1.03] active:scale-95 transition-all duration-200">
              <FiFileText size={15} /> Build ATS Resume
            </Link>
            <a href="#how"
               className="flex items-center gap-2 px-7 py-3.5 rounded-2xl text-sm font-bold text-gray-700
                          bg-white border border-gray-200 shadow-sm
                          hover:border-violet-300 hover:text-violet-700 hover:shadow-md
                          transition-all duration-200">
              How it works <FiArrowRight size={14} />
            </a>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="py-24 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-xs font-bold tracking-widest uppercase text-violet-600 mb-3">Process</p>
          <h2 className="text-center text-4xl font-black text-gray-900 tracking-tight mb-14">
            How it works
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map(({ icon, num, title, desc }) => (
              <div key={num} className="relative flex flex-col gap-4 p-6 rounded-2xl
                                        border border-gray-100 bg-gray-50
                                        hover:border-violet-200 hover:bg-violet-50/50
                                        hover:-translate-y-1 hover:shadow-lg hover:shadow-violet-100/50
                                        transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-500
                                  flex items-center justify-center text-white shadow-md shadow-violet-200">
                    {icon}
                  </div>
                  <span className="text-4xl font-black text-gray-800">{num}</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                </div>

              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-xs font-bold tracking-widest uppercase text-violet-600 mb-3">Features</p>
          <h2 className="text-center text-4xl font-black text-gray-900 tracking-tight mb-14">
            Everything you need to prepare
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {FEATURES.map(({ icon, title, desc }) => (
              <div key={title}
                   className="flex flex-col gap-4 p-6 rounded-2xl border border-gray-100 bg-white
                              hover:border-violet-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-100/40
                              transition-all duration-200">
                <div className="w-11 h-11 rounded-xl bg-violet-50 border border-violet-100
                                flex items-center justify-center text-violet-600">
                  {icon}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl px-10 py-14 text-center
                          bg-gradient-to-r from-violet-600 to-fuchsia-500
                          shadow-[0_24px_60px_rgba(109,40,217,0.35)]">
            {/* decorative blobs */}
            <div className="absolute -top-10 -left-10 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-10 -right-10 w-64 h-64 rounded-full bg-white/10 blur-2xl" />

            <p className="relative text-white/70 text-sm font-semibold tracking-widest uppercase mb-3">
              Ready to level up?
            </p>
            <h2 className="relative text-4xl font-black text-white mb-4 tracking-tight">
              Start your AI interview today
            </h2>
            <p className="relative text-white/75 max-w-md mx-auto mb-8 leading-relaxed">
              No sign-up required. Upload your resume and get your first set of personalized questions in seconds.
            </p>
            <Link to="/interview"
                  className="relative inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl
                             text-sm font-bold text-violet-700 bg-white
                             hover:scale-[1.04] active:scale-95 shadow-lg transition-all duration-200">
              <FiZap size={15} /> Start Interview
            </Link>
            <Link to="/ats-checker"
                  className="relative inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl
                             text-sm font-bold text-blue-700 bg-white
                             hover:scale-[1.04] active:scale-95 shadow-lg transition-all duration-200">
              <FiShield size={15} /> Check Resume
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <Footer/>
    </div>
  )
}
