import { useNavigate } from 'react-router'
import logoHorizontal from '../assets/LOGO-HORIZENTAL.svg'
import Button from '../design-system/components/Button'
import LegalFooterLinks from '../components/LegalFooterLinks'
import { useHeroMotion } from '../components/motion/AnimatedHero'

export default function Hero() {
  const navigate = useNavigate()
  const rootRef = useHeroMotion()

  return (
    <div
      ref={rootRef}
      className="min-h-screen flex flex-col items-center justify-center px-6 py-16 relative overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, var(--color-bg-canvas) 0%, var(--color-primary-50) 45%, var(--color-bg-canvas) 100%)',
      }}
    >
      {/* Soft brand atmosphere — keep structure; no full lilac wash */}
      <div
        data-motion-blob
        className="absolute rounded-full pointer-events-none"
        style={{
          width: '520px', height: '520px',
          top: '-120px', right: '-100px',
          background: 'radial-gradient(circle, rgba(148,47,205,0.14), transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      <div
        data-motion-blob
        className="absolute rounded-full pointer-events-none"
        style={{
          width: '420px', height: '420px',
          bottom: '-80px', left: '-80px',
          background: 'radial-gradient(circle, rgba(148,47,205,0.10), transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      <div
        data-motion-blob
        className="absolute rounded-full pointer-events-none"
        style={{
          width: '300px', height: '300px',
          top: '30%', left: '15%',
          background: 'radial-gradient(circle, rgba(181,101,228,0.12), transparent 70%)',
          filter: 'blur(50px)',
        }}
      />

      <div className="relative z-10 flex flex-col items-center">
        <img
          data-hero-logo
          src={logoHorizontal}
          alt="Questly"
          className="mb-8 w-[200px] sm:w-[300px] md:w-[400px] lg:w-[480px]"
          style={{ height: 'auto' }}
        />

        <h1
          data-hero-title
          className="font-bold text-center text-[#0c0c0d] leading-[1.2] w-full max-w-[1050px] mb-6
                     text-[36px] sm:text-[48px] md:text-[60px] lg:text-[74px]"
          style={{
            fontFamily: 'Inter, sans-serif',
            letterSpacing: '-1px',
          }}
        >
          Turn your daily tasks into epic quests
        </h1>

        <p
          data-hero-subtitle
          className="text-center text-[#0c0c0d] leading-[1.5] mb-14 w-full max-w-[790px]
                     text-[16px] sm:text-[18px] md:text-[20px] lg:text-[23px]"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          Earn XP, unlock rewards, and climb the leaderboard with your team all in one gamified workspace
        </p>

        <div data-hero-cta className="flex items-center gap-6 sm:gap-8 md:gap-[50px]">
          <Button
            onClick={() => navigate('/signup')}
            className="w-[130px] h-[50px] text-[14px] sm:w-[150px] sm:h-[58px] sm:text-[15px] md:w-[170px] md:h-[65px] md:text-[16px]"
          >
            Sign up
          </Button>

          <Button
            onClick={() => navigate('/login')}
            className="w-[130px] h-[50px] text-[14px] sm:w-[150px] sm:h-[58px] sm:text-[15px] md:w-[170px] md:h-[65px] md:text-[16px]"
          >
            Sign in
          </Button>
        </div>
      </div>

      <div data-hero-footer className="absolute bottom-6 left-0 right-0 z-10">
        <LegalFooterLinks />
      </div>
    </div>
  )
}
