/**
 * @see https://umijs.org/docs/max/access#access
 * */
export default function access(initialState: { user?: API.CurrentUser } | undefined) {
  const { user } = initialState ?? {};
  console.warn(user);
  // console.warn(user?.carManagerLength);
  return {

  };
}
