
export default function Footer() {
  return (
    <footer className="bg-white border-t border-surface-dark/50 mt-auto">
      <div className="container-waylight py-4">
        <div className="text-center">
          <p className="text-xs text-ink-light">
            © 2025 Waylight. Made with magic for Disney fans • Not affiliated with The Walt Disney Company.
          </p>
          <p className="text-xs text-ink-light mt-2">
            Powered by live data from{' '}
            <a
              href="https://themeparks.wiki"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary-dark underline"
            >
              ThemeParks.wiki
            </a>{' '}
            and{' '}
            <a
              href="https://queue-times.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary-dark underline"
            >
              Queue-Times.com
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}