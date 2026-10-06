export function redirectTo(path, status = 303) {
  return new Response(null, { status, headers: { Location: path } });
}
