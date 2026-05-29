const Message = require("./models/messageModel")
const MessageService = require('./services/messageService')
const messageService = new MessageService()

// CORRECCIÓN 1: Importamos correctamente la instancia desde el paquete 'ollama'
// O BIEN, REEMPLAZA LAS LÍNEAS 5 Y 6 POR ESTO (Sin llaves y sin espacio):
const ollama = require('ollama').default

module.exports = (io) => {
    
    io.on('connection', async (socket) => {
        console.log('Un nuevo usuario conectado')
        
        // Enviamos el historial completo al nuevo usuario que entra
        const messagesData = await messageService.getAll()
        io.emit('all-messages', messagesData)
        
        // Evento de escribir
        socket.on('writing', (username) => {
            socket.broadcast.emit('writing', username)
        })

        // Evento principal: Nuevo mensaje del usuario
        socket.on('new-message', async (data) => {
            // 'try' para capturar errores
            try {
                // Guardamos el mensaje del cliente
                await messageService.create(data)

                // Actualizamos el chat de todos en tiempo real
                let messages = await messageService.getAll()
                io.emit('all-messages', messages)
                // Simulamos que la IA está respondiendo en el frontend
                io.emit('writing', 'Ollama_AI')
                
                //  OBTENEMOS EL DÍA ACTUAL AUTOMÁTICAMENTE
                const diasSemana = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];
                const hoyIndice = new Date().getDay(); // Devuelve 0 para Domingo, 1 para Lunes, etc.
                const diaActual = diasSemana[hoyIndice];

                // Diccionario estricto de platos para el bot
                const platosDeHoy = {
                    "Lunes": "Chaque",
                    "Martes": "Chairo",
                    "Miercoles": "Chochoca",
                    "Jueves": "Menestron",
                    "Viernes": "Chupe de viernes",
                    "Sabado": "Chicharron y platos extras",
                    "Domingo": "Adobo y platos extras"
                };

                const platoDeHoy = platosDeHoy[diaActual];


             // Traemos solo los 2 últimos mensajes para no saturar al modelo Qwen
                // Esto le da "memoria de corto plazo" a la IA
                const totalHistory = await messageService.getAll()
                const recentMessages = totalHistory.slice(-3, -1).map(msg => ({
                    role: msg.username === 'Ollama_AI' ? 'assistant' : 'user',
                    content: msg.message
                }))
                // Petición directa a tu modelo Gemma de 270M usando la instancia correcta
                //con la identida de pincateria juanita
                const response = await ollama.chat({
                    model: 'qwen2.5:1.5b', 
                   messages: [
                    { 
                    role: 'system', 
                    content: `Eres el mozo virtual de la "Picanteria Juanita" en Uchumayo, Arequipa.
                            
                            DATOS DEL SISTEMA REAL (HOY):
                            - Hoy es día: ${diaActual}
                            - El plato que corresponde ofrecer hoy es: ${platoDeHoy}
                            
                            MENU COMPLETO POR SI TE LO PIDEN:
                            - Lunes: Chaque | Martes: Chairo | Miercoles: Chochoca | Jueves: Menestron | Viernes: Chupe de viernes | Sabado: Chicharron | Domingo: Adobo

                            REGLAS ESTRICTAS:
                            1. Si el cliente saluda con "hola", responde cordialmente: "¡Hola! Bienvenido a Picantería Juanita. ¿En qué puedo ayudarte hoy?"
                            2. Si te preguntan qué hay de comer HOY, responde directamente indicando que hoy es ${diaActual} y que toca ${platoDeHoy}.
                            3. Jamás inventes palabras como "Chiche", sé exacto con los nombres: Chaque, Chairo, Chochoca.
                            4. Responde en una sola línea de texto plano, sin asteriscos.`
            
                
                        },  
                ...recentMessages,
                { role: 'user', content: data.message }
    ],
})

                // Preparamos el mensaje de la IA
                const aiResponse = {
                    username: 'Ollama_AI',
                    message: response.message.content
                }

                // Guardamos la respuesta de la IA en MongoDB
                await messageService.create(aiResponse)
                
                // Traemos el historial final y lo esparcimos a todos los clientes
                messages = await messageService.getAll()
                io.emit('all-messages', messages)


            } catch (error) {
                console.error("Error crítico con Ollama:", error)
                // Volvemos a traer los mensajes actuales para no romper la interfaz
                const currentMessages = await messageService.getAll()
                // En caso de error (ej. Ollama apagado), enviamos una notificación al chat
                io.emit('all-messages', [
                    ...currentMessages, 
                    { username: 'Sistema', message: 'Error: No se pudo conectar con el motor de Ollama.' }
                ])
            }
        })
    })
}