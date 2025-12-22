import { Link } from "react-router-dom";
import { MapPin, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProjectCardProps {
  id: string;
  title: string;
  description: string;
  schoolName: string;
  location: string;
  imageUrl?: string | null;
  amountNeeded: number;
  amountRaised: number;
  isUrgent?: boolean;
  studentsHelped?: number;
}

const ProjectCard = ({
  id,
  title,
  description,
  schoolName,
  location,
  imageUrl,
  amountNeeded,
  amountRaised,
  isUrgent = false,
  studentsHelped = 0,
}: ProjectCardProps) => {
  const progress = amountNeeded > 0 ? (amountRaised / amountNeeded) * 100 : 0;
  const remaining = Math.max(0, amountNeeded - amountRaised);

  return (
    <div className="card-project group">
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full gradient-hero flex items-center justify-center">
            <Heart className="w-16 h-16 text-white/50" />
          </div>
        )}
        
        {/* Urgent Badge */}
        {isUrgent && (
          <div className="absolute top-3 left-3 badge-urgent">
            Urgent Need
          </div>
        )}

        {/* Bookmark Button */}
        <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-background/90 flex items-center justify-center hover:bg-background transition-colors">
          <Heart className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {title}
        </h3>
        
        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
          {description}
        </p>

        {/* School Info */}
        <div className="mb-4">
          <p className="font-semibold text-sm">{schoolName}</p>
          <p className="text-muted-foreground text-xs flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {location}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="progress-bar">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-lg font-bold text-accent">${remaining.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">still needed</p>
          </div>
          {studentsHelped > 0 && (
            <div className="text-right">
              <p className="text-lg font-bold text-primary">{studentsHelped}</p>
              <p className="text-xs text-muted-foreground">girls helped</p>
            </div>
          )}
        </div>

        {/* CTA Button */}
        <Link to={`/donate?product=${id}`}>
          <Button className="w-full btn-primary">
            <Heart className="w-4 h-4 mr-2" />
            Donate Now
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default ProjectCard;