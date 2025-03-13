import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../service/admin/admin.service';
import { DadosSenha } from '../../interface/dadossenha';
import { CommonModule } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from '../../service/auth/auth.service';
import { Router } from '@angular/router';
import { Database, ref, get } from '@angular/fire/database';


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
      this.carregarSetores(); // Carrega os setores disponíveis
      this.verificarSetorUsuario(); // Garante que o usuário selecione o setor correto
    }
  }

  // Carrega os setores do Firebase
  async carregarSetores() {
    const setoresRef = ref(this.db, `avelar/setor`);
    const snapshot = await get(setoresRef);

    if (snapshot.exists()) {
      const setoresData = snapshot.val() as Record<string, { setor: string }>;
      this.setoresDisponiveis = Object.values(setoresData).map(item => item.setor);
      console.log('Setores carregados:', this.setoresDisponiveis);
    } else {
      console.log('Nenhum setor encontrado no banco de dados.');
    }
  }

  // Verifica se o usuário logado pertence ao setor selecionado
  async verificarSetorUsuario() {
    // Criamos um identificador único para cada aba
    const abaId = this.gerarIdentificadorAba();
  
    // Verifica se já há um setor salvo para esta aba
    const setorSalvo = localStorage.getItem(`setorUsuario_${abaId}`);
    if (setorSalvo) {
      this.setorUsuario = setorSalvo;
      this.setorUsuarioDefinido = true;
      console.log(`Setor carregado para a aba ${abaId}:`, this.setorUsuario);
      this.carregarSenhasDoSetor();
      return;
    }
  
    // Se ainda não foi definido, busca do banco
    this.authService.getUser().subscribe(async user => {
      if (user && !this.setorUsuarioDefinido) {
        const userRef = ref(this.db, `usuarios/${user.uid}`);
        const snapshot = await get(userRef);
  
        if (snapshot.exists()) {
          this.setorUsuario = snapshot.val().setor.trim().toLowerCase();
  
          // Salva no localStorage com o ID da aba
          localStorage.setItem(`setorUsuario_${abaId}`, this.setorUsuario);
          this.setorUsuarioDefinido = true;
          
          console.log(`Setor do usuário logado (Aba ${abaId}):`, this.setorUsuario);
  
          // Se o setor selecionado for diferente, corrige
          if (this.setorSelecionado.trim().toLowerCase() !== this.setorUsuario) {
            alert(`Você só pode acessar senhas do setor: ${this.setorUsuario}`);
            this.setorSelecionado = this.setorUsuario;
          }
  
          this.carregarSenhasDoSetor();
        }
      }
    });
  }
  
  // Gera um identificador único para cada aba
private gerarIdentificadorAba(): string {
  // Sempre gera um novo ID quando a aba é recarregada
  const abaId = Math.random().toString(36).substring(2, 15); // Gera um ID aleatório
  sessionStorage.setItem('abaId', abaId); // Salva o novo ID no sessionStorage
  return abaId;
}

  // Carrega apenas as senhas do setor correspondente
  private carregarSenhasDoSetor() {
    this.adminService.getSenhaPainelConvencional().subscribe(async d => {
      this.senha = [];
      this.senhasChamadas = [];

      for (let index = 0; index < d.length; index++) {
        const senhaRef = ref(this.db, `avelar/senhachamada/${d[index].horachamada}`);
        const snapshot = await get(senhaRef);

        if (snapshot.exists()) {
          const senhaData = snapshot.val();

          // Filtra apenas senhas do setor do usuário logado
          if (senhaData.setor && senhaData.setor.trim().toLowerCase() === this.setorUsuario.trim().toLowerCase()) {
            if (d[index].status === '1') {
              this.senha.push(d[index]);
            } else if (d[index].status === '2') {
              this.senhasChamadas.push(d[index]);
            }
          }
        }
      }

      console.log('Senhas filtradas:', this.senha);
      console.log('Senhas chamadas filtradas:', this.senhasChamadas);

      const interval = setInterval(async () => {
        if (this.senha[0] != undefined) {
          await this.playAudio(this.senha[0]);
        }
      }, 3000);
    });

    this.pegavalor(this.senhasChamadas.length);
    this.audio.src = "../assets/audio/SOM.wav";
    //this.audio.load();
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
      this.pnome = senha.cliente;
      this.ppreferencial = senha.preferencial;
  
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
  
      // Agora, chamar a fala da senha
      await this.falarSenha(senha);
  
      // Atualizar status da senha
      this.senha[0] = { ...senha, status: '2' };
      this.adminService.updateSenhaChamadaConvencional(this.senha[0].horachamada, this.senha[0]);
  
      // Atualizar lista de senhas chamadas
      this.atualizarSenhasChamadas(senha);
  
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
      // Criar a fala da senha
      const utterThis = new SpeechSynthesisUtterance(`${senha.cliente} Senha ${senha.senha} Guichê ${senha.guiche}`);
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
