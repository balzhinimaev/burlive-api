<template>
  <div>
    <DashboardHeadingComponent title="Мой профиль" />
    <!-- <button class="mt-2 btn btn-primary btn-sm">Редактировать профиль</button> -->
    <div class="col-lg-12 m-auto">
      <div class="profile-edit-wrapper">
        <div class="row">
          <div class="col-lg-2">
            <div class="avatar">
              <img
                id="preview"
                alt="Предпросмотр изображения"
                :src="imageSrc"
                v-if="imageSrc"
              />
              <img
                id="preview"
                alt="Предпросмотр изображения"
                :src="avatar"
                v-if="avatar"
              />
              <button
                class="btn btn-success mt-3"
                @click="saveProfilePhoto"
                v-if="imageSrc"
              >
                Сохранить
              </button>
              <label for="file-upload" class="custom-file-upload">
                Загрузить изображение
              </label>
            </div>
            <input
              type="file"
              id="file-upload"
              accept="image/*"
              style="display: none"
              @change="previewFile"
            />
          </div>
          <div class="col-lg-8">
            <form @submit.prevent="">
              <div class="row">
                <div class="col-lg-6">
                  <label for="firstName" class="form-label">Имя</label>
                  <input
                    type="text"
                    id="firstName"
                    class="form-control"
                    v-model="firstName"
                  />
                </div>
                <div class="col-lg-6">
                  <label for="lastName" class="form-label">Фамилия</label>
                  <input
                    type="text"
                    id="lastName"
                    class="form-control"
                    v-model="lastName"
                  />
                </div>
              </div>
              <button class="btn btn-primary my-3" @click="saveUserData()">
                Сохранить
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
const avatar = ref("");
const firstName = ref();
const lastName = ref();
onBeforeMount(() => {
  const { data, pending, error } = useFetch(
    () => `http://localhost:5555/api/users/getMe`,
    {
      method: "get",
      headers: {
        Authorization: `Bearer ${useCookie("token").value}`,
        "Content-Type": "application/json", // Укажите тип контента, если это необходимо,
      },
      onResponse({ request, response, options }) {
        // Process the response data
        avatar.value = response._data.user.avatar;
        firstName.value = response._data.user.firstName;
        lastName.value = response._data.user.lastName;
      },
    }
  );
});
const myFile: any = ref();
const imageSrc = ref();
async function previewFile(event: any) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e: any) {
      const base64String = e.target.result;
      imageSrc.value = base64String;
    };
    reader.readAsDataURL(file);
    // console.log(reader)
  }
}
async function uploadFile() {
  let formData = new FormData();
  console.log(myFile);
  // formData.append("files", myFile, myFile.name);
  console.log(formData);
}
async function saveProfilePhoto() {
  const { data, pending, error } = useFetch(
    () => `http://localhost:5555/api/users/set-profile-photo`,
    {
      method: "put",
      headers: {
        Authorization: `Bearer ${useCookie("token").value}`,
        "Content-Type": "application/json", // Укажите тип контента, если это необходимо,
      },
      body: {
        userProfilePhoto: imageSrc.value,
      },
    }
  );
}

async function saveUserData() {
  try {
    const { data, pending, error } = useFetch(
      () => `http://localhost:5555/api/users/update-user-data`,
      {
        method: "put",
        headers: {
          Authorization: `Bearer ${useCookie("token").value}`,
          "Content-Type": "application/json", // Укажите тип контента, если это необходимо,
        },
        body: {
          firstName: firstName.value,
          lastName: lastName.value
        },
      }
    );
  } catch (error) {
    console.log(error);
  }
}
</script>

<style lang="scss" scoped>
.form-input-component {
}
.avatar {
  margin-bottom: 15px;
  display: flex;
  flex-direction: column;
  img {
    width: 128px;
    height: 128px;
    display: block;
    margin: auto;
    border-radius: 10px;
  }
}
.profile-edit-wrapper {
  // background-image: linear-gradient(45deg, #ddeceba1, #cbe9e666);
  margin-top: 1rem;
}

.custom-file-upload {
  display: block;
  text-decoration: underline;
  cursor: pointer;
  text-align: center;
  margin: 10px auto 0;
}
</style>