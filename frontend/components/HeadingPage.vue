<template>
    <div class="heading-page-wrapper">                                   
        <button>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                    d="M11.3793 13.9331L4.94626 7.50005L11.3793 1.067C11.6237 0.822639 11.6237 0.427634 11.3793 0.183272C11.1349 -0.0610906 10.7399 -0.0610906 10.4956 0.183272L3.62065 7.0582C3.37629 7.30256 3.37629 7.69757 3.62065 7.94193L10.4956 14.8169C10.6175 14.9387 10.7774 15 10.9375 15C11.0974 15 11.2575 14.9387 11.3793 14.8169C11.6237 14.5725 11.6237 14.1775 11.3793 13.9331Z"
                    fill="black" />
            </svg>
        </button>
        <p>{{ title }}</p>
        <button style="user-select: none; visibility: hidden">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                    d="M11.3793 13.9331L4.94626 7.50005L11.3793 1.067C11.6237 0.822639 11.6237 0.427634 11.3793 0.183272C11.1349 -0.0610906 10.7399 -0.0610906 10.4956 0.183272L3.62065 7.0582C3.37629 7.30256 3.37629 7.69757 3.62065 7.94193L10.4956 14.8169C10.6175 14.9387 10.7774 15 10.9375 15C11.0974 15 11.2575 14.9387 11.3793 14.8169C11.6237 14.5725 11.6237 14.1775 11.3793 13.9331Z"
                    fill="black" />
            </svg>
        </button>
    </div>
</template>

<script lang="ts" setup>
interface Props {
    title: string;
}

// Определяем и принимаем props
defineProps<Props>();
</script>

<style scoped lang="scss">
.heading-page-wrapper {
    display: flex;
    justify-content: space-between;
    width: 100%;
    margin-bottom: 16px;
    button {
        padding: 10px;
        background-color: #fff;
        border: 0;
        border-radius: 10px;
        box-shadow: 0 4px 4px #0000002c;
        margin: auto 15px auto 0;
    }
    p {
        margin: auto 0;
        font-size: 24px;
        font-weight: bold;
        font-family: 'Nunito', sans-serif;
        line-height: 24px;
    }
}
</style>
