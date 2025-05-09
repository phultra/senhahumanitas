import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../service/admin/admin.service';
import { DadosSenha } from '../../interface/dadossenha';
import { CommonModule } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from '../../service/auth/auth.service';
import { Router } from '@angular/router';
import { Database, ref, get, onValue } from '@angular/fire/database';


import { ChangeDetectorRef } from '@angular/core';

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
export class PainelComponent implements OnInit {

  psenha: string = '000';
  pguiche: string = '00';
  pnome: string = 'Nome';
  senha: DadosSenha[] = [];
  senhasChamadas: DadosSenha[] = [];
  setorUsuario: string = ''; // Armazena o setor do usuário logado
  setoresDisponiveis: string[] = []; // Lista de setores disponíveis
  setorSelecionado: string = ''; // Setor escolhido pelo usuário
  ppreferencial: boolean = false;
  private synth = window.speechSynthesis;
  audio = new Audio();
  private queue: (() => Promise<void>)[] = [];
  private isSpeaking = false;
  private senhasChamadasSubject = new BehaviorSubject<DadosSenha[]>([]);
  senhasChamadas$ = this.senhasChamadasSubject.asObservable();
  ni: number = 0;
  private setorUsuarioDefinido = false; // Impede que o setor seja alterado mais de uma vez

  private chamadaMap = new Map<string, number>();
  isProcessing: any;

  constructor(
    private cdRef: ChangeDetectorRef,
    private adminService: AdminService,
    private authService: AuthService,
    private router: Router,
    private db: Database
  ) {}

  ngOnInit() {
    if (!this.authService.isUserAuthenticated()) {
      this.router.navigate(['/login']);
    } else {
     
      this.carregarTodasAsSenhas();
      // this.verificarSetorUsuario(); // Garante que o usuário selecione o setor correto
    }
  }



  // Carrega senhas
  private carregarTodasAsSenhas() {
    const senhageradaRef = ref(this.db, 'avelar/senhachamada');
    let paginaCarregada = false; // Flag para verificar se a página já foi carregada
    let senhasIniciais: DadosSenha[] = []; // Armazena as senhas iniciais para comparação
  
    // Escuta mudanças no nó senhachamada
    onValue(senhageradaRef, snapshot => {
      if (snapshot.exists()) {
        const senhasGeradas = snapshot.val();
        const novasSenhas = Object.values(senhasGeradas) as DadosSenha[];
  
        // Atualiza a lista de senhas
        this.senha = novasSenhas;
  
        // Armazena as senhas iniciais na primeira execução
        if (!paginaCarregada) {
          senhasIniciais = [...novasSenhas];
          paginaCarregada = true;
          return; // Não processa senhas na primeira execução
        }
  
        // Verifica se há novas senhas após a página estar carregada
        if (novasSenhas.length > senhasIniciais.length) {
          const novaSenha = novasSenhas[novasSenhas.length - 1]; // Última senha adicionada
  
          // Move a senha anterior para a lista de senhas chamadas
          if (this.psenha !== '000') {
            const senhaAnterior = { senha: this.psenha, guiche: this.pguiche } as DadosSenha;
            this.atualizarSenhasChamadas(senhaAnterior);
          }
  
          // Fala a nova senha
          this.playAudio(novaSenha);
        }
  
        // Atualiza a lista de senhas iniciais
        senhasIniciais = [...novasSenhas];
      } else {
        console.log('Nenhuma senha encontrada no nó senhagerada.');
      }
    }, error => {
      console.error('Erro ao monitorar senhas do nó senhagerada:', error);
    });
  }

  atualizarSenhasChamadas(senha: DadosSenha) {
    const senhas = this.senhasChamadasSubject.value;
  
    // Verifica se a senha já está na lista
    const senhaExistente = senhas.some(s => s.senha === senha.senha);
  
    // Se a senha já existir, não adiciona de novo
    if (!senhaExistente) {
      if (senhas.length >= 4) {
        senhas.shift(); // Remove a primeira senha se a lista estiver cheia
      }
      senhas.push(senha); // Adiciona a nova senha
      this.senhasChamadasSubject.next(senhas);
    }
  }
  pegavalor(valor: number) {
    this.ni = valor;
  }

  async playAudio(senha: DadosSenha) {
    if (this.isProcessing) {
      console.warn("Aguarde a finalização da senha atual antes de chamar outra.");
      return;
    }
  
    try {
      this.isProcessing = true;
  
      // Atualizar as variáveis que aparecem no painel
      this.psenha = senha.senha;
      this.pguiche = senha.guiche;
  
      // Forçar a atualização da interface
      this.cdRef.detectChanges();
  
      // Configurar e tocar o áudio
      this.audio.src = "../assets/audio/SOM.wav";
      this.audio.load();
  
      await new Promise<void>((resolve, reject) => {
        this.audio.oncanplaythrough = () => resolve();
        this.audio.onerror = () => reject("Erro ao carregar o áudio");
      });
  
      await this.audio.play();
      await new Promise<void>(resolve => {
        this.audio.onended = () => resolve();
      });
  
      // Agora, chamar a fala da senha letra por letra
      await this.falarSenha(senha);
  
      // Forçar nova atualização da interface após a senha ser chamada
      this.cdRef.detectChanges();
  
    } catch (error) {
      console.error("Erro ao processar a senha: ", error);
    } finally {
      this.isProcessing = false;
    }
  }
  
  
  private async falarSenha(senha: DadosSenha) {
    return new Promise<void>((resolve, reject) => {
      // Criar a fala da senha letra por letra
      const senhaPorLetras = senha.senha.split('').join(' ');
      const utterThis = new SpeechSynthesisUtterance(`Senha ${senhaPorLetras}, Guichê ${senha.guiche}`);
      utterThis.rate = 0.9;
  
      // Quando a fala terminar, liberar para chamar a próxima senha
      utterThis.onend = () => {
        resolve();
      };
  
      utterThis.onerror = event => {
        console.error('Erro ao falar: ', event.error);
        reject(event.error);
      };
  
      // Falar a senha
      this.synth.speak(utterThis);
    });
  }
  

  private processQueue() {
    if (!this.isSpeaking && this.queue.length > 0) {
      const speakFn = this.queue.shift();
      if (speakFn) {
        speakFn().catch(error => {
          console.error(error);
          this.isSpeaking = false;
          this.processQueue();
        });
      }
    }
  }
}
