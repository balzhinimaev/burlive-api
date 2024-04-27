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
      <div class="side rightside">
        <div class="content">
          <div class="keyboard">
            <form @submit.prevent="">
              <input type="text" class="form-control" />
              <button>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4.99994 12L4.39594 6.563C4.22294 5.007 5.82494 3.864 7.23994 4.535L19.1839 10.193C20.7089 10.915 20.7089 13.085 19.1839 13.807L7.23994 19.466C5.82494 20.136 4.22294 18.994 4.39594 17.438L4.99994 12ZM4.99994 12H11.9999"
                    stroke="black"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
useSeoMeta({
  title: "Сообщения",
});
</script>

<style lang="scss" scoped>
.messages-wrapper {
  display: flex;
  max-height: 750px;
}
section {
  padding: 1rem;
  border-radius: 15px;
  background-color: var(--messages-wrapper-background);
}
.leftside {
    overflow-y: scroll;
    flex: none;
}
.rightside {
  padding: 15px;
  background-color: var(--messages-wrapper-rightside-background-color);
  width: 100%;
  margin-left: 15px;
  border-radius: 15px;
  .content {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
}
.keyboard {
    margin-top: auto;
}
.keyboard form {
  display: flex;
  input {
    border-radius: 15px;
  }
  button {
    border: 0;
    font-size: 18px;
    line-height: 1;
    border-radius: 50%;
    display: block;
    background-color: transparent;
    padding: 0;
    margin-left: 5px;
    svg {
      width: 30px;
      height: 30px;
      path {
        fill: transparent;
        stroke: $green;
      }
    }
  }
}
</style>
