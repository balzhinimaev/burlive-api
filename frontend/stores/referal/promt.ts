// store/auth.ts

import { defineStore } from 'pinia';

export const usePromtStore = defineStore('create-promt', {
    state: () => ({
        text: '',
        loading: false,
        statusCode: 0,
        falseLoading: true
    }),
    actions: {
        async createPromt() {

            this.statusCode = 0

            const { data, pending, error, refresh } = await useFetch('/api/promt/create', {
                method: 'post',
                body: { text: this.text, token: useCookie('token').value },
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

                return useRouter().push(`/dashboard/promts`)

            }

        },
    },
});