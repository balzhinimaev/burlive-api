// store/auth.ts

import { defineStore } from 'pinia';

interface CashPayloadInterface {
    name: string;
    pseudonym: string;
    code: string;
    // phones: number[];
}

interface Organization {
    name: string,
    inn: string,
    ogrn: string
}

interface State {
    loading: boolean,
    status: any,
    phones: string[],
    cashName: string,
    pseudonym: string,
    code: string,
    cashNameError: boolean,
    pseudonymError: boolean,
    codeError: boolean,
    organizationName: string,
    organizationINN: string,
    organizationOGRN: string,
    organizationNameError: boolean,
    organizationINNError: boolean,
    organizationOGRNError: boolean,

    authLoginError: boolean,
    authPasswordError: boolean,
    authPasswordConfirmError: boolean,

    authLogin: string,
    authPassword: string,
    authPasswordConfirm: string
}

export const useCashRegistrationStore = defineStore('cash-registration', {
    state: (): State => ({
        loading: false,
        status: null,
        phones: [],
        cashName: '',
        pseudonym: '',
        code: '',

        cashNameError: false,
        pseudonymError: false,
        codeError: false,

        organizationName: '',
        organizationINN: '',
        organizationOGRN: '',
        organizationNameError: false,
        organizationINNError: false,
        organizationOGRNError: false,

        authLoginError: false,
        authPasswordError: false,
        authPasswordConfirmError: false,

        authLogin: "",
        authPassword: "",
        authPasswordConfirm: "",
    }),
    actions: {
        async registrationCash({ name, pseudonym, code }: CashPayloadInterface) {

            return useFetch('/api/cash/registration', {
                method: 'post',
                body: {
                    name: this.cashName,
                    pseudonym: this.pseudonym,
                    code: this.pseudonym,
                    phones: this.phones,
                    author: '658929baf50ccb6f0ff64fe3',
                    authentication: useCookie('token').value
                }
            })

        },

        async checkOnExists() {
            return useFetch('/api/cash/checkCashOnExists', {
                method: 'post',
                body: {
                    cashName: this.cashName
                }
            })
        },

        async checkOnExistsPseudonym() {
            return useFetch('/api/cash/checkPseudonymOnExists', {
                method: 'post',
                body: {
                    pseudonym: this.pseudonym
                }
            })
        },

        async isCodeExists() {
            return useFetch('/api/cash/isCodeExists', {
                method: 'post',
                body: {
                    cashCode: this.code
                }
            })
        },

        async isNameExists() {
            return useFetch('/api/organization/isNameExists', {
                method: 'post',
                body: {
                    name: this.organizationName
                }
            })
        },

        async isINNExists() {
            return useFetch('/api/organization/isINNExists', {
                method: 'post',
                body: {
                    inn: this.organizationINN
                }
            })
        },

        async isOGRNExists() {
            return useFetch('/api/organization/isOGRN', {
                method: 'post',
                body: {
                    ogrn: this.organizationOGRN
                }
            })
        },

    },
});