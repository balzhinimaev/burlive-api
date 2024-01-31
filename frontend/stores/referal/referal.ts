// store/auth.ts

import { defineStore } from 'pinia';

interface UserPayloadInterface {
    email: string;
    password: string;
}

export const useReferalStore = defineStore('create-referal-link', {
    state: () => ({
        name: '',
        deeplink: '',
        loading: false,
        message: '',
        statusCode: 0,
        falseLoading: true
    }),
    actions: {
        async createRef() {

            this.statusCode = 0

            const { data, pending, error, refresh } = await useFetch('/api/deeplink/create', {
                method: 'post',
                body: { name: this.name, deeplink: this.deeplink, token: useCookie('token').value },
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
              console.log(data)
              return useRouter().push(`/dashboard`)

            }

        },
    },
});