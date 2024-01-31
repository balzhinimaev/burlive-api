// store/auth.ts

import { defineStore } from 'pinia';

interface UserPayloadInterface {
    email: string;
    username: string;
    password: string;
}

export const userRegisterStore = defineStore('user-register', {

    state: () => ({
        authenticated: false,
        loading: false,
        statusCode: 0,
        status: '',
        result: '',
        email: '',
        username: '',
        password: '',
        passwordConfirm: '',
    }),

    actions: {
        async registrationUser() {
            const { data, pending, error, refresh } = await useFetch<{
                message: string,
                status: number,
                id: string,
            }>('/api/registration', {
                method: 'post',
                body: {
                    email: this.email,
                    username: this.username,
                    password: this.password
                },
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
                    // this.status = 
                    // Process the response data
                    // localStorage.setItem('token', response._data.token)
                  },
                  onResponseError({ request, response, options }) {
                    console.log('on response error')
                    console.log(response)
                    // Handle the response errors
                  }            
                })

            if (data.value) {

                this.status = 'success'
                this.result = data.value.message

            }
            
            if (error.value) {
                if (error.value.statusCode) {
                    this.statusCode = error.value.statusCode
                    this.status = 'error'
                    this.result = error.value.data.message
                }
            }

            this.loading = pending.value;

        },

    },
});