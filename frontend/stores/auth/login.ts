// store/auth.ts

import { defineStore } from 'pinia';

interface UserPayloadInterface {
    email: string;
    password: string;
}

export const useAuthStore = defineStore('user-login', {
    state: () => ({
        authenticated: false,
        loading: false,
        message: '',
        username: '',
        statusCode: 0,
        password: ''
    }),
    actions: {
        async authenticateUser() {

            this.statusCode = 0

            const { data, pending, error, refresh } = await useFetch<{
                token: string,
            }>('/api/login', {
                method: 'post',
                body: { username: this.username, password: this.password },
                onRequest({ request, options }) {
                    // Set the request headers
                    options.headers = options.headers || {}

                    console.log('on request')

                  },
                  onRequestError({ request, options, error }) {
                    console.log('on request error')
                    console.log(error)
                    // Handle the request errors
                  },
                  onResponse({ request, response, options }) {
                    console.log('on response')
                    console.log(response)
                    // Process the response data
                    // localStorage.setItem('token', response._data.token)
                  },
                  onResponseError({ request, response, options }) {
                    console.log('on response error')
                    console.log(response)
                    console.log('123123')
                    // Handle the response errors
                  }
            })

            this.loading = pending.value;

            if (data.value) {

                if (!data.value?.token) { this.message = 'токен не получен'; return }

                useCookie('token').value = data.value?.token
                useCookie("token", {
                    maxAge: 60 * 60 * 24 * 3
                })
                useRouter().push('dashboard')

            }

            if (error.value) {

                if (error.value.data.statusCode === 401) {

                    this.password = ''
                    this.statusCode = 401

                }

                this.message = error.value.data.data.message

            }
        },
        logUserOut() {
            const token = useCookie('token'); // useCookie new hook in nuxt 3
            this.authenticated = false; // set authenticated  state value to false
            token.value = null; // clear the token cookie
        },
    },
});