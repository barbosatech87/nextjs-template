export default async function BlogLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: any;
}) {
  // Não precisamos usar params aqui, apenas aceitar para satisfazer o tipo do Next.
  return <>{children}</>;
}