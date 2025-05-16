import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../service/admin/admin.service';
import { DadosSenha } from '../../interface/dadossenha';
import { CommonModule } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from '../../service/auth/auth.service';
import { Router } from '@angular/router';
import { Database, ref, get, onValue, update } from '@angular/fire/database';


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
  pconsultorio: string = '00';
  senha: DadosSenha[] = [];
  senhasChamadas: DadosSenha[] = [];
  setorUsuario: string = ''; // Armazena o setor do usuário logado
  setoresDisponiveis: string[] = []; // Lista de setores disponíveis
  setorSelecionado: string = ''; // Setor escolhido pelo usuário
  ppreferencial: boolean = false;
  private synth = window.speechSynthesis;
  audio = new Audio();
  private queue: { senha: DadosSenha; action: () => Promise<void> }[] = [];
  private isSpeaking = false;
  private senhasChamadasSubject = new BehaviorSubject<DadosSenha[]>([]);
  senhasChamadas$ = this.senhasChamadasSubject.asObservable();
  ni: number = 0;
  private setorUsuarioDefinido = false; // Impede que o setor seja alterado mais de uma vez

  private chamadaMap = new Map<string, number>();
  isProcessing: any;
private ultimoPaciente: { nome: string, consultorio: string, horachamada: string } | null = null;
  private ultimaSenha: string | null = null;
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
 

  onValue(senhageradaRef, snapshot => {
    if (snapshot.exists()) {
      const senhasGeradas = snapshot.val();
      const novasSenhas = Object.values(senhasGeradas) as DadosSenha[];
// Limpa controles se alguma senha foi finalizada
    if (novasSenhas.some(s => s.status === '3')) {
      
      this.ultimaSenha = null;
    }
      // Busca chamada de paciente (nome e consultorio preenchidos) ainda não processada
     const chamadaPaciente = novasSenhas.find(s =>
  s.status === '1' &&
  s.nome &&
  s.consultorio &&
  (!this.ultimoPaciente || s.horachamada !== this.ultimoPaciente.horachamada)
);

      // Busca chamada de senha convencional (sem nome e consultorio) ainda não processada
     const chamadaSenha = novasSenhas.find(s =>
  s.status === '1' &&
  (!s.nome || !s.consultorio) &&
  (!this.ultimaSenha || s.horachamada !== this.ultimaSenha)
);

     if (chamadaPaciente) {
  this.ultimoPaciente = { 
    nome: chamadaPaciente.nome, 
    consultorio: chamadaPaciente.consultorio,
    horachamada: chamadaPaciente.horachamada // <-- adicione isso
  };
  this.atualizarSenhasChamadas(chamadaPaciente);
      } else if (chamadaSenha) {
        // Atualiza controle para senha convencional
        this.ultimaSenha = chamadaSenha.horachamada;
        this.atualizarSenhasChamadas(chamadaSenha);
      }
    } else {
      console.log('Nenhuma chamada encontrada no nó senhachamada.');
      this.psenha = '000'; // Reseta o painel
      this.pguiche = '00';
    }
  }, error => {
    console.error('Erro ao monitorar chamadas no nó senhachamada:', error);
  });
}

atualizarSenhasChamadas(senha: DadosSenha) {
  const senhas = this.senhasChamadasSubject.value;

  // Remove qualquer chamada anterior com o mesmo senhaid
  const idx = senhas.findIndex(s => s.senhaid === senha.senhaid);
  if (idx !== -1) {
    senhas.splice(idx, 1);
  }

  // Adiciona a nova senha (mantendo limite de 4)
  if (senhas.length >= 4) {
    senhas.shift();
  }
  senhas.push(senha);
  this.senhasChamadasSubject.next(senhas);

  // Adiciona à fila de chamadas se ainda não estiver na fila
  const senhaNaFila = this.queue.some(item =>
    item.senha.senha === senha.senha && item.senha.horachamada === senha.horachamada
  );
  if (!senhaNaFila) {
    this.queue.push({ senha, action: () => this.playAudio(senha) });
    this.processQueue();
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
  
     if (senha.nome && senha.consultorio) {
      // Chamada de paciente
      this.psenha = senha.nome; // Nome do paciente
      this.pguiche = senha.consultorio; // Número do consultório
      this.pconsultorio = senha.consultorio; // Atualiza o consultório
    } else {
      // Chamada de senha
      this.psenha = senha.senha; // Senha
      this.pguiche = senha.guiche; // Guichê
      this.pconsultorio = '00'; // Reseta o consultório
    }
  
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
  
   // Após a chamada, atualize o status da senha no banco de dados
    const chamadaPath = `avelar/senhachamada/${senha.senhaid}`;
    await update(ref(this.db), {
      [chamadaPath]: {
        ...senha,
        status: '2' // Status "chamada processada"
      }
    });

    console.log(`Chamada processada: ${senha.senhaid}`);
  } catch (error) {
    console.error("Erro ao processar a senha: ", error);
  } finally {
    this.isProcessing = false;

    // Processar a próxima senha na fila
    this.processQueue();
  }
}


  
  
  private async falarSenha(senha: DadosSenha) {
  return new Promise<void>((resolve, reject) => {
    let textoFala = '';

    // Verifica se é uma chamada de paciente ou senha
    if (senha.nome && senha.consultorio) {
      // Chamada de paciente
      textoFala = `Paciente ${senha.nome}, Consultório ${senha.consultorio}`;
    } else {
      // Chamada de senha
      const senhaPorLetras = senha.senha.split('').join(' ');
      textoFala = `Senha ${senhaPorLetras}, Guichê ${senha.guiche}`;
    }

    const utterThis = new SpeechSynthesisUtterance(textoFala);
    utterThis.rate = 0.9;

    // Quando a fala terminar, liberar para chamar a próxima
    utterThis.onend = () => {
      resolve();
    };

    utterThis.onerror = event => {
      console.error('Erro ao falar: ', event.error);
      reject(event.error);
    };

    // Falar o texto
    this.synth.speak(utterThis);
  });
}
  

private async processQueue() {
  if (!this.isProcessing && this.queue.length > 0) {
    const nextItem = this.queue.shift(); // Remove o próximo item da fila
    if (nextItem) {
      await nextItem.action(); // Await the function to ensure proper execution
      this.processQueue(); // Processa a próxima senha após finalizar a atual
    }
  }
}

}

