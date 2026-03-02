import logoHorizontal from '../assets/LOGO-HORIZENTAL.svg'
import Button from '../design-system/components/Button'

const fadeUp = (delay) => ({
  animation: `heroFadeUp 0.7s ease ${delay}s both`,
})

export default function Hero({ onNavigate }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-16 relative overflow-hidden"
      style={{
        background: 'linear-gradient(145deg, #c4b5fd 0%, #ddd6fe 35%, #f5d0fe 65%, #fce7f3 95%)',
      }}
    >
      {/* Background blobs */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: '520px', height: '520px',
          top: '-120px', right: '-100px',
          background: 'radial-gradient(circle, rgba(168,85,247,0.35), transparent 70%)',
          filter: 'blur(60px)',
          animation: 'blobDrift1 9s ease-in-out infinite',
        }}
      />
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: '420px', height: '420px',
          bottom: '-80px', left: '-80px',
          background: 'radial-gradient(circle, rgba(232,121,249,0.3), transparent 70%)',
          filter: 'blur(60px)',
          animation: 'blobDrift2 11s ease-in-out infinite',
        }}
      />
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: '300px', height: '300px',
          top: '30%', left: '15%',
          background: 'radial-gradient(circle, rgba(129,140,248,0.25), transparent 70%)',
          filter: 'blur(50px)',
          animation: 'blobDrift3 13s ease-in-out infinite',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center">

        {/* Logo */}
        <img
          src={logoHorizontal}
          alt="Questly"
          className="mb-8 w-[200px] sm:w-[300px] md:w-[400px] lg:w-[480px]"
          style={{ height: 'auto', ...fadeUp(0) }}
        />

        {/* Heading */}
        <h1
          className="font-bold text-center text-[#0c0c0d] leading-[1.2] w-full max-w-[1050px] mb-6
                     text-[36px] sm:text-[48px] md:text-[60px] lg:text-[74px]"
          style={{
            fontFamily: 'Inter, sans-serif',
            letterSpacing: '-1px',
            ...fadeUp(0.15),
          }}
        >
          Turn your daily tasks into epic quests
        </h1>

        {/* Subheading */}
        <p
          className="text-center text-[#0c0c0d] leading-[1.5] mb-14 w-full max-w-[790px]
                     text-[16px] sm:text-[18px] md:text-[20px] lg:text-[23px]"
          style={{ fontFamily: 'Inter, sans-serif', ...fadeUp(0.3) }}
        >
          Earn XP, unlock rewards, and climb the leaderboard with your team all in one gamified workspace
        </p>

        {/* Buttons */}
        <div className="flex items-center gap-6 sm:gap-8 md:gap-[50px]" style={fadeUp(0.45)}>
          <Button
            onClick={() => onNavigate?.('signup')}
            className="w-[130px] h-[50px] text-[14px] sm:w-[150px] sm:h-[58px] sm:text-[15px] md:w-[170px] md:h-[65px] md:text-[16px]"
          >
            Sign up
          </Button>

          <Button
            onClick={() => onNavigate?.('signin')}
            className="w-[130px] h-[50px] text-[14px] sm:w-[150px] sm:h-[58px] sm:text-[15px] md:w-[170px] md:h-[65px] md:text-[16px]"
          >
            Sign in
          </Button>
        </div>

      </div>
    </div>
  )
}
