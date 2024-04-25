<template>
    <div>
        <DashboardHeadingComponent title="Сообщения" />
        <section class="messages-wrapper">
            <div class="side leftside">
                <DashboardMessagesDialogElementComponent></DashboardMessagesDialogElementComponent>
                <DashboardMessagesDialogElementComponent></DashboardMessagesDialogElementComponent>
                <DashboardMessagesDialogElementComponent></DashboardMessagesDialogElementComponent>
                <DashboardMessagesDialogElementComponent></DashboardMessagesDialogElementComponent>
                <DashboardMessagesDialogElementComponent></DashboardMessagesDialogElementComponent>
                <DashboardMessagesDialogElementComponent></DashboardMessagesDialogElementComponent>
                <DashboardMessagesDialogElementComponent></DashboardMessagesDialogElementComponent>
                <DashboardMessagesDialogElementComponent></DashboardMessagesDialogElementComponent>
                <DashboardMessagesDialogElementComponent></DashboardMessagesDialogElementComponent>
                <DashboardMessagesDialogElementComponent></DashboardMessagesDialogElementComponent>
                <DashboardMessagesDialogElementComponent></DashboardMessagesDialogElementComponent>
            </div>
            <div class="side rightside"></div>
        </section>
    </div>
</template>

<script lang="ts" setup>
useSeoMeta({
    title: 'Сообщения'
})</script>

<style lang="scss" scoped>
.messages-wrapper {
    display: flex;
    max-height: 750px
}
section {
    padding: 1rem;
    border-radius: 15px;
    background-color: var(--messages-wrapper-background);
}
</style>