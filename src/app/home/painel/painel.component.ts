import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../service/admin/admin.service';
import { DadosSenha } from '../../interface/dadossenha';
import { CommonModule } from '@angular/common';

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
@Component({
  selector: 'app-painel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './painel.component.html',
  styleUrl: './painel.component.scss'
})
export class PainelComponent implements OnInit{

  psenha: string = '000';
  pguiche: string = '00';
  pnome: string = 'Nome';
  senha: DadosSenha[] =[];
  senhasChamadas:DadosSenha[] = [];
  ppreferencial: boolean = false;
  private synth = window.speechSynthesis;
  audio = new Audio();
  proximasSenhas: DadosSenha[] = [];  // Array para armazenar as próximas 3 senhas
   
  //private currentIndex: number = 0; // Índice da senha atual
  
  
  private queue: (() => Promise<void>)[] = [];
  private isSpeaking = false;

  ni: number = 0;

  constructor(
    private adminService: AdminService
  ) {}
 
 // Inicializa o componente e carrega as senhas do painel convencional.
  ngOnInit(){
  
     // CÓDIGO PAINEL CONVENCIONAL
    this.adminService.getSenhaPainelConvencional().subscribe(async d =>{
      console.log(d.length);
      this.senha = [];
      this.senhasChamadas =[];
      
      // Filtra as senhas baseadas no status e popula os arrays correspondentes.
      for (let index = 0; index < d.length; index++) {
       // console.log(index);
        if ( d[index].status === '1' ){
            this.senha.push(d[index]);  
            console.log(this.senha);
         
        }

        if ( d[index].status === '2' ){
          this.senhasChamadas.push(d[index]);  
        //  console.log(this.senhasChamadas);
      }
      }
        
     // this.senha.reverse()
     // console.log(this.senha);
     console.log(this.senha);
     console.log(this.senhasChamadas);


     // Configura um intervalo para tocar o áudio da próxima senha a cada 3 segundos.
     const interval = setInterval(async () => {
      if(this.senha[0] != undefined) {
        
        await this.playAudio(this.senha[0]);
        console.log('ENTROU MAIS UMA VEZ');
      }
     }, 3000);
  

    });

    
  
    this.pegavalor(this.senhasChamadas.length);
    this.audio.src = "../assets/audio/SOM.wav";
    this.audio.load();
  }

  // Define o valor do índice de senhas chamadas.
  pegavalor(valor: number) {
    this.ni = valor;
  }


 // Reproduz o áudio associado à senha atual e atualiza seu status.
async  playAudio(senha:DadosSenha) {
   // const audio = new Audio();
   // audio.src = "../assets/audio/SOM.wav";
   //  audio.load();
   //  audio.play(); // Espera o áudio ser tocado
   this.senha[0].status = '2';
  this.adminService.updateSenhaChamadaConvencional(this.senha[0].horachamada, this.senha[0]);
   console.log(senha.senha)
    await delay(3000).then(async d=>{
      console.log('Audio OK');
      this.psenha = senha.senha;
      this.pguiche = senha.guiche;
      this.pnome = senha.cliente;
      
      // Converte a senha em fala e toca o áudio associado.
      await this.falarSenha(senha).then(d =>{
        console.log(d);
        this.audio.play();
       
      })
    })
    
  }


    // Converte a senha e informações associadas em fala utilizando a API SpeechSynthesis.
  private async falarSenha(senha: DadosSenha) {
    return new Promise<void>((resolve, reject) => {
      const checkSpeaking = setInterval(() => {
        if (!this.synth.speaking) {
          clearInterval(checkSpeaking);

          const utterThis = new SpeechSynthesisUtterance(`${senha.cliente} Senha ${senha.senha} Guichê ${senha.guiche}`);
          utterThis.rate = 0.9; // Define a velocidade da fala.


          // Resolve a promessa quando a fala for concluída.
          utterThis.onend = () => {
            console.log('Terminado de falar.');
            this.isSpeaking = false;
            this.processQueue(); // Processa a próxima fala na fila
            resolve();
          };

          
          // Lida com erros durante a fala.
          utterThis.onerror = (event) => {
            console.error('Erro ao falar: ', event.error);
            this.isSpeaking = false;
            this.processQueue(); // Processa a próxima fala na fila, mesmo em caso de erro
            reject(event.error);
          };


          // Inicia a fala.
          this.synth.speak(utterThis);
          this.isSpeaking = true;
        }
      }, 100); // Verifica a cada 100ms
    });
  }


  // Processa a fila de falas para garantir que uma fala seja executada de cada vez.
  private processQueue() {
    if (!this.isSpeaking && this.queue.length > 0) {
      const speakFn = this.queue.shift(); // Pega a próxima função na fila
      if (speakFn) {
        speakFn().catch((error) => {
          console.error(error);
          this.isSpeaking = false;
          this.processQueue(); // Em caso de erro, processa a próxima na fila
        });
      }
    }
  }


}
