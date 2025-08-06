import { Badge } from "@/components/ui/badge";
import { StreamMetadata } from "@/lib/types/stream-types";
import { Clock, Radio, Tv, Users } from "lucide-react";



export const StreamCard = ({ stream, isSelected, onSelect, isDemo }: { stream: StreamMetadata; isSelected: boolean; onSelect: (stream: StreamMetadata) => void; isDemo?: boolean }) => (
    <div
      onClick={() => onSelect(stream)}
      className={`group relative overflow-hidden rounded-2xl cursor-pointer border-2 transition-all duration-300 ease-in-out ${
        isSelected ? 'border-primary shadow-[0_0_30px_theme(colors.primary/40%)]' : 'border-white/10 hover:border-primary/50 hover:scale-[1.02] hover:shadow-2xl'
      }`}
    >
        <div className="aspect-video bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <Tv className="w-16 h-16 text-white/10 transition-transform duration-300 group-hover:scale-110" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-5 w-full">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-serif text-xl font-bold text-white truncate group-hover:text-primary transition-colors">{stream.title}</h3>
                {stream.isLive && (
                    <Badge className="bg-red-500/90 border border-red-400/50 text-white shadow-lg"><Radio className="w-3 h-3 mr-1.5" />LIVE</Badge>
                )}
            </div>
            <div className="flex items-center gap-4 text-xs font-mono text-white/70">
                <div className="flex items-center gap-1.5"><Users className="w-3 h-3" />{stream.viewers} Viewers</div>
                <div className="flex items-center gap-1.5"><Clock className="w-3 h-3" />{new Date(stream.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
            {isDemo && !isSelected && <Badge variant="secondary" className="absolute top-4 left-4 text-xs bg-white/10 border-white/20">Demo</Badge>}
        </div>
    </div>
);