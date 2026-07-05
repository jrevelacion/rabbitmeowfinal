import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="mt-auto bg-black/40 border-t border-white/10 pt-8 pb-6">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About Section */}
          <div>
            <h3 className="text-white font-medium text-lg mb-4">RabbitMeow</h3>
            <p className="text-white/70 text-sm">
              Discover and enjoy the best movies and TV shows all in one place. RabbitMeow helps you find, explore, and watch your favorite content online.
            </p>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="text-white font-medium mb-4">Explore</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-white/70 hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/movies" className="text-white/70 hover:text-white transition-colors">
                  Movies
                </Link>
              </li>
              <li>
                <Link to="/tv" className="text-white/70 hover:text-white transition-colors">
                  TV Shows
                </Link>
              </li>
              <li>
                <Link to="/trending" className="text-white/70 hover:text-white transition-colors">
                  Trending
                </Link>
              </li>
              <li>
                <Link to="/search" className="text-white/70 hover:text-white transition-colors">
                  Search
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Legal */}
          <div>
            <h3 className="text-white font-medium mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/terms" className="text-white/70 hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-white/70 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/dmca"
                  className="text-white/70 hover:text-white transition-colors"
                >
                  DMCA Notice
                </Link>
              </li>
              <li>
                <Link
                  to="/content-removal"
                  className="text-white/70 hover:text-white transition-colors"
                >
                  Content Removal
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-4 border-t border-white/10 text-center text-white/50 text-xs">
          <p>© {currentYear} RabbitMeow All rights reserved.</p>
          <p className="mt-1">
            This site does not store any files on its server. All contents are provided by non-affiliated third parties.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;