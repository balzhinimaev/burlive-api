import { useAuthStore } from "@/stores/auth/login";

export default defineNuxtRouteMiddleware((to) => {
    const { authenticated } = storeToRefs(useAuthStore()); // make authenticated state reactive
    const token = useCookie('token'); // get token from cookies

    if (token.value) {
        // check if value exists
        authenticated.value = true; // update the state to authenticated
    }

    // if token exists and url is /login redirect to homepage
    if (token.value && to?.name === 'auth' || token.value && to?.name === 'registration') {
        return navigateTo('/dashboard');
    }
    console.log('123')
    // if token doesn't exist redirect to log in
    if (
      (!token.value && to?.name == "dashboard") ||
      (!token.value && to?.name == "sentences") || 
      (!token.value && to?.name == "users") || 
      (!token.value && to?.name == "translations")
    ) {
      abortNavigation();
      return navigateTo("/auth");
    }
});