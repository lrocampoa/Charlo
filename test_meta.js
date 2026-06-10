const payload = {
  name: "test",
  category: "MARKETING",
  language: "es_MX",
  components: [
    {
      type: "BODY",
      text: "¡Hola, {{1}}! 🎉 Tu compra {{2}} ha sido confirmada con éxito. Ya estamos preparando todo para que llegue lo antes posible a tus manos. 🚀",
      example: {
        body_text: [["Texto de prueba", "Texto de prueba"]]
      }
    },
    {
      type: "BUTTONS",
      buttons: [
        {
          type: "QUICK_REPLY",
          text: "ALTO 🛑"
        }
      ]
    }
  ]
};
console.log(JSON.stringify(payload, null, 2));
