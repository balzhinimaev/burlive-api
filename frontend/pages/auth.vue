<template>
    <div class="page auth-page">
        <div class="container">
            <h5>Вход</h5>
            <authFormComponent></authFormComponent>
        </div>
    </div>
</template>

<script setup>
definePageMeta({
    middleware: [
        'authed',
    ],
});
</script>