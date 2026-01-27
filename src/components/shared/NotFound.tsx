import React from "react";
import { Home, ArrowLeft, Mail, MonitorOff, Youtube, FileSearch, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NotFoundProps {
  title?: string;
  message?: string;
  showBack?: boolean;
}

const NotFound: React.FC<NotFoundProps> = ({
  title = "Signal Interrupted",
  message = "The video insight you're looking for seems to have been clipped or never existed.",
  showBack = true,
}) => {
  const [elements, setElements] = React.useState<
    {
      size: string;
      top: string;
      left: string;
      delay: string;
      opacity: number;
      color: string;
      duration: string;
      type: "play" | "pixel";
    }[]
  >([]);

  React.useEffect(() => {
    const colors = ["bg-primary", "bg-blue-500", "bg-red-500", "bg-slate-400"];
    const types: ("play" | "pixel")[] = ["play", "pixel"];
    const generatedElements = [...Array(30)].map(() => ({
      size: Math.random() * 15 + 5 + "px",
      top: Math.random() * 100 + "%",
      left: Math.random() * 100 + "%",
      delay: Math.random() * 5 + "s",
      opacity: Math.random() * 0.3 + 0.1,
      duration: Math.random() * 6 + 4 + "s",
      color: colors[Math.floor(Math.random() * colors.length)],
      type: types[Math.floor(Math.random() * types.length)],
    }));
    setElements(generatedElements);
  }, []);

  return (
    <div data-testid="not-found" className="flex min-h-[calc(100vh-160px)] items-center justify-center p-6 relative overflow-hidden w-full bg-white">
      {/* Background decorative elements - Digital Noise/Waveform theme */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-40">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/10 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-blue-500/10 to-transparent"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] animate-pulse"></div>
      </div>

      {/* Floating UI Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {elements.map((el, i) => (
          <div
            key={i}
            className={`absolute ${el.color} animate-float-element transition-all duration-700`}
            style={{
              width: el.size,
              height: el.size,
              top: el.top,
              left: el.left,
              animationDelay: el.delay,
              animationDuration: el.duration,
              opacity: el.opacity,
              borderRadius: el.type === "pixel" ? "2px" : "50%",
              clipPath: el.type === "play" ? "polygon(20% 10%, 90% 50%, 20% 90%)" : "none",
            }}
          />
        ))}
      </div>

      <div className="text-center space-y-12 max-w-5xl px-4 relative z-10 w-full pt-10">
        {/* Elevated Floating Label */}
        <div className="flex justify-center mb-4">
          <div className="relative inline-block animate-float-label">
            {/* Outer Glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-red-500/30 via-primary/30 to-blue-500/30 rounded-3xl blur-md opacity-75"></div>

            {/* Glassmorphism Container */}
            <div className="relative bg-white/90 backdrop-blur-xl px-10 py-4 rounded-[2rem] border border-white shadow-xl">
              <div className="flex items-center gap-4">
                <div className="bg-red-500/10 p-2 rounded-lg">
                  <MonitorOff className="w-6 h-6 text-red-500 animate-pulse" />
                </div>
                <h2 className="text-xl font-bold tracking-tight sm:text-3xl bg-gradient-to-r from-slate-900 via-primary to-blue-600 bg-clip-text text-transparent uppercase">
                  {title}
                </h2>
              </div>
            </div>
          </div>
        </div>

        <div className="relative inline-block group">
          {/* Error Code with Digital Glitch Feel */}
          <div className="relative">
            <h1 className="text-[clamp(8rem,20vw,18rem)] font-black leading-none tracking-tighter select-none transition-all duration-1000 group-hover:tracking-[0.1em] text-slate-100">
              404
            </h1>
            <div className="absolute inset-0 flex items-center justify-center">
              <Youtube className="w-32 h-32 text-red-500/20 group-hover:scale-125 transition-transform duration-500" />
            </div>
          </div>
        </div>

        <div className="space-y-8 max-w-2xl mx-auto">
          <div className="space-y-4">
            <p className="text-slate-700 text-xl sm:text-2xl leading-relaxed font-semibold">{message}</p>
            <p className="text-slate-500 text-lg font-medium">
              Maybe the URL was mistyped, or the video summary hasn&apos;t been generated yet.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
            {showBack && (
              <Button
                variant="outline"
                size="lg"
                onClick={() => window.history.back()}
                className="group w-full sm:w-auto h-16 px-10 border-2 border-slate-200 rounded-[1.25rem] font-bold text-lg transition-all duration-300 hover:bg-white hover:border-primary/60 hover:text-primary hover:shadow-[0_20px_40px_rgba(37,99,235,0.1)] active:scale-95 bg-white shadow-sm relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <ArrowLeft className="w-6 h-6 mr-3 transition-transform group-hover:-translate-x-2 relative z-10" />
                <span className="relative z-10">Go Back</span>
              </Button>
            )}

            <a href="/dashboard" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="group w-full h-16 px-10 bg-slate-950 text-white shadow-[0_15px_30px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)] hover:-translate-y-1 transition-all duration-300 active:scale-95 rounded-[1.25rem] font-bold text-lg relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <Home className="w-6 h-6 mr-3 transition-transform group-hover:scale-110 relative z-10" />
                <span className="relative z-10">Return Home</span>
              </Button>
            </a>
          </div>
        </div>

        {/* Content Exploration Grid */}
        <div className="pt-20 grid grid-cols-1 md:grid-cols-3 gap-6 text-left border-t border-slate-100">
          {[
            {
              href: "/dashboard",
              icon: FileSearch,
              color: "text-blue-500",
              bgColor: "bg-blue-50",
              title: "Find Summaries",
              desc: "Browse through your AI-generated video insights.",
            },
            {
              href: "/videos",
              icon: Sparkles,
              color: "text-purple-500",
              bgColor: "bg-purple-50",
              title: "New Insights",
              desc: "Convert a new YouTube video into a detailed summary.",
            },
            {
              href: "mailto:support@ytinsights.app",
              icon: Mail,
              color: "text-red-500",
              bgColor: "bg-red-50",
              title: "Get Help",
              desc: "Can't find what you're looking for? Let's fix that.",
            },
          ].map((item, idx) => (
            <a
              key={idx}
              href={item.href}
              className="group p-8 rounded-3xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all duration-300 hover:border-primary/10"
            >
              <div
                className={`w-12 h-12 rounded-xl ${item.bgColor} flex items-center justify-center mb-6 transition-transform group-hover:scale-110 shadow-sm`}
              >
                <item.icon className={`w-6 h-6 ${item.color}`} />
              </div>
              <h3 className="font-bold text-xl text-slate-800 mb-2">{item.title}</h3>
              <p className="text-slate-500 font-medium">{item.desc}</p>
            </a>
          ))}
        </div>
      </div>

      <style>{`
                @keyframes float-label {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }

                @keyframes float-element {
                    0%, 100% { transform: translate(0, 0) rotate(0); }
                    33% { transform: translate(15px, -15px) rotate(10deg); }
                    66% { transform: translate(-10px, 10px) rotate(-10deg); }
                }

                .animate-float-label {
                    animation: float-label 4s ease-in-out infinite;
                }

                .animate-float-element {
                    animation: float-element 8s ease-in-out infinite;
                }
            `}</style>
    </div>
  );
};

export default NotFound;
