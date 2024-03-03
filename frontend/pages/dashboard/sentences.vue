<template>
  <div>
    <DashboardHeadingComponent title="Предложения" />
    <DashboardSentencesComponent />
  </div>
</template>
<script setup lang="ts">
import { ref, watch } from "vue";
const calendarDate = ref("");
const calendarDateTo = ref("");
const day = ref("");
const dateFillFrom = ref(false);
const dateFillTo = ref(false);

const customData = ref({
  "referral_links": [
    {
      "purpose": "Invite friends to the chat",
      "link": "https://t.me/your_bot?start=invite123",
      "click_count": 25
    },
    {
      "purpose": "Get a discount on subscription",
      "link": "https://t.me/your_bot?start=discount456",
      "click_count": 12
    },
    {
      "purpose": "Join beta testing",
      "link": "https://t.me/your_bot?start=beta789",
      "click_count": 8
    },
    {
      "purpose": "Share on social media",
      "link": "https://t.me/your_bot?start=share567",
      "click_count": 5
    }
  ]
}
)

async function calendarPicker(e: any) {
  try {
    console.log(e);
  } catch (error) {
    console.log(error);
  }
}

async function dateMask(e: any) {
  const strinData: string = e.data;

  if (e.inputType === "deleteContentBackward") {
    dateFillFrom.value = false;
    return false;
  }

  await maskNucleus(calendarDate, strinData, 1);
}
async function dateMask2(e: any) {
  const strinData: string = e.data;

  if (e.inputType === "deleteContentBackward") {
    dateFillTo.value = false;
    return false;
  }

  await maskNucleus(calendarDateTo, strinData, 2);
}

async function maskNucleus(data: any, strinData: any, dateStatus: any) {
  if (data.value.length > 14) {
    data.value = data.value.slice(0, -1);
  }

  if (data.value.length == 14 && dateStatus == 1) {
    dateFillFrom.value = true;
  } else if (data.value.length == 14 && dateStatus == 2) {
    dateFillTo.value = true;
  }

  if (isNaN(Number(strinData.slice(-1)))) {
    data.value = data.value.slice(0, -1);
  }

  if (data.value.length == 1) {
    const num = parseFloat(strinData);
    if (num >= 4) {
      data.value = "0" + strinData + " / ";
    }
  }

  if (parseFloat(data.value[0]) < 4 && data.value.length == 2) {
    const num = parseFloat(strinData);

    if (parseFloat(data.value[0]) === 3 && num > 1) {
      data.value = data.value.slice(0, -1);
      data.value = data.value + "1 / ";
    } else {
      data.value = data.value + " / ";
    }
  }

  if (parseFloat(data.value[0]) < 4 && data.value.length == 6) {
    const num = parseFloat(strinData);
    if (num > 1) {
      data.value = data.value.slice(0, -1);
      data.value = data.value + "0" + num + " / ";
    }
  }

  if (parseFloat(data.value[0]) < 4 && data.value.length == 7) {
    const num = parseFloat(strinData);
    console.log(parseFloat(data.value[5]));
    if (parseFloat(data.value[5]) == 1 && num > 2) {
      data.value = data.value.slice(0, -1);
      data.value = data.value + "2 / 20";
    } else if (parseFloat(data.value[5]) == 1 && num <= 2) {
      data.value = data.value + " / 20";
    }
  }
}
</script>
<style lang="scss" scoped>
main {
  // background: #f0f0f0;
  // border: 1px solid #222;
  width: 100%;
  padding: 1rem;
  border-radius: 3px;
  margin-top: 0.5rem;
}

.form-filter {
  display: flex;
  justify-content: space-between;
}

.calendar {
  user-select: none;
  width: 180px;
  text-align: center;
}

.dateFillTo {}</style>