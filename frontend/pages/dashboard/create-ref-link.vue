<template>
    <div>
        <DashboardHeadingComponent title="Создание реферальной ссылки" />
        <div class="row">
            <div class="col-xl-5">
                <form @submit.prevent="createRef">
                    <div class="mb-3">
                        <label for="name" class="form-label">Название ссылки</label>
                        <input type="text" id="name" class="form-control" v-model="name">
                    </div>
                    <div class="mb-3">
                        <label for="deeplink" class="form-label">Значение ссылки</label>
                        <input type="text" @input="deeplinkCustomWatcher" id="deeplink" class="form-control" v-model="deeplink">
                    </div>
                    <button class="btn btn-primary" :class="{ 'disabled': loading }">Сохранить</button>
                </form>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { useReferalStore } from '@/stores/referal/referal';
import { storeToRefs } from "pinia"; // import storeToRefs helper hook from pinia

const store = useReferalStore()
const { createRef } = useReferalStore()
const loading = storeToRefs(store).loading
const name = storeToRefs(store).name
const deeplink = storeToRefs(store).deeplink

async function deeplinkCustomWatcher(symb: any) {
  try {

    // console.log(symb)

    if (symb.inputType === 'deleteContentBackward') { return false }

    if (isValidSymbol(symb.data) === false || deeplink.value.length >= 64) { 
        deeplink.value = deeplink.value.slice(0, -1);
      return false 
    }

  } catch (error) {

    console.log(error)

  }
}

function isValidSymbol(symbol: string) {
  return /^[a-zA-Z0-9_-]$/.test(symbol);
}
</script>