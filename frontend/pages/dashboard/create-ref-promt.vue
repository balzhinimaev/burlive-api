<template>
    <div>
        <DashboardHeadingComponent title="Создание нового промта" />
        <div class="row">
            <div class="col-xl-5">
                <form @submit.prevent="createPromt">
                    <div class="mb-3">
                        <label for="name" class="form-label">Текст промта</label>
                        <input type="text" id="name" class="form-control" v-model="name">
                    </div>
                    <button class="btn btn-primary" :class="{ 'disabled': loading }">Сохранить</button>
                </form>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { storeToRefs } from "pinia"; // import storeToRefs helper hook from pinia
import { usePromtStore } from '~/stores/referal/promt';

const store = usePromtStore()
const { createPromt } = usePromtStore()
const loading = storeToRefs(store).loading
const name = storeToRefs(store).text

// async function deeplinkCustomWatcher(symb: any) {
//   try {

//     // console.log(symb)

//     if (symb.inputType === 'deleteContentBackward') { return false }

//     if (isValidSymbol(symb.data) === false || deeplink.value.length >= 64) { 
//         deeplink.value = deeplink.value.slice(0, -1);
//       return false 
//     }

//   } catch (error) {

//     console.log(error)

//   }
// }

function isValidSymbol(symbol: string) {
  return /^[a-zA-Z0-9_-]$/.test(symbol);
}
</script>