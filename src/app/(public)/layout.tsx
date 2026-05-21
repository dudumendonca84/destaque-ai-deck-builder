// Layout do deck público — experiência fullscreen, sem header/footer.
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <div className="public-root">{children}</div>;
}
