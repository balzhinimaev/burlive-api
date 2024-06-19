// store/auth.ts

import { defineStore } from "pinia";

interface UserPayloadInterface {
  email: string;
  password: string;
}
const apiUrl = "http://localhost:5000/backendapi";
export const useAuthStore = defineStore("user-login", {
  state: () => ({
    authenticated: false,
    loading: false,
    isError: false,
    error: null as any,
    message: "",
    username: "",
    statusCode: 0,
    password: "",
  }),
  actions: {
    // async authenticateUser() {
    //   this.statusCode = 0;

    //   const { data, pending, error, refresh } = await useFetch<{
    //     token: string;
    //   }>("/api/login", {
    //     method: "post",
    //     body: { username: this.username, password: this.password },
    //     onRequest({ request, options }) {
    //       // Set the request headers
    //       options.headers = options.headers || {};

    //       console.log("on request");
    //     },
    //     onRequestError({ request, options, error }) {
    //       console.log("on request error");
    //       console.log(error);
    //       // Handle the request errors
    //     },
    //     onResponse({ request, response, options }) {
    //       this.authenticated = true;
    //       useCookie("token").value = data.value?.token;
    //       useCookie("token", {
    //         maxAge: 60 * 60 * 24 * 3,
    //       });
    //       return useRouter().push("dashboard");
    //       // Process the response data
    //       // localStorage.setItem('token', response._data.token)
    //     },
    //     onResponseError({ request, response, options }) {
    //       // Handle the response errors
    //     },
    //   });

    //   this.loading = pending.value;

    //   if (data.value) {
    //   }

    //   if (error.value) {
    //     if (error.value.data.statusCode === 401) {
    //       this.password = "";
    //       this.statusCode = 401;
    //     }

    //     this.message = error.value.data.data.message;
    //   }
    // },
    async authenticateUser() {
      this.loading = true;
      try {
        const response = await fetch(`${apiUrl}/users/login`, {
          method: "post",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            password: this.password,
            email: this.username,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error();
        } else {
          useCookie("token").value = data.token;
          useCookie("token", {
            maxAge: 60 * 60 * 24 * 3,
          });
          console.log(data)
          console.log(useCookie("token"))
          await useUserStore().fetchUser(data.token);
          this.authenticated = true;
          return useRouter().push("dashboard");
        }
      } catch (error) {
        if (error instanceof Error) {
          this.error = { message: error.message };
          this.isError = true;
        } else {
          this.error = { message: "Неизвестная ошибка" };
        }
      } finally {
        this.loading = false;
      }
    },
    logUserOut() {
      const token = useCookie("token"); // useCookie new hook in nuxt 3
      this.authenticated = false; // set authenticated  state value to false
      token.value = null; // clear the token cookie
    },
  },
});
